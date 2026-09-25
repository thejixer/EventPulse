# EventPulse

EventPulse is a NestJS-based event processing system where distributed agents continuously generate events, a central processing service evaluates those events against configurable rules, and historical rule matches are stored for efficient reporting.

## Architecture

```text
┌─────────────┐
│   Agent 1   │──┐
└─────────────┘  │
                 │
┌─────────────┐  │       ┌──────────────┐
│   Agent 2   │──┼─────▶│  RabbitMQ    │
└─────────────┘  │       └──────┬───────┘
                 │              │
┌─────────────┐  │              ▼
│   Agent N   │──┘        ┌──────────────┐
└─────────────┘           │   Process    │
                          └──────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
                MongoDB                 Rule Matching
```

## Running locally

### Prerequisites

- Docker
- Docker Compose

### Environment configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Update the values in `.env` if necessary.

### Start the system

To start the infrastructure and four Agent instances:

```bash
docker compose up -d --build --scale agent=4
```

The `--scale agent=4` option starts four independent Agent containers using the same Agent image.

Each Agent automatically uses its Docker container hostname as its `agentId`, so every running instance has a unique identifier.

To view the running containers:

```bash
docker compose ps
```

To follow Agent logs:

```bash
docker compose logs -f agent
```

To stop the system:

```bash
docker compose down
```

Persistent data is stored in Docker volumes and is not removed by `docker compose down`.

## Agent

Agents are stateless NestJS standalone applications responsible for generating and publishing events to RabbitMQ.

### Event generation

Each agent generates approximately **5 events per second**.

Event types are generated in a deterministic sequential cycle rather than randomly selecting an event type:

```text
temperature
speed
pressure
voltage
noise
light
temperature
speed
pressure
...
```

Once the last event type is reached, the sequence resets to the beginning.

Event values are generated using `@faker-js/faker`.

Each event contains:

```json
{
	"eventId": "550e8400-e29b-41d4-a716-446655440000",
	"agentId": "777195963a57",
	"name": "temperature",
	"value": 73.42,
	"timestamp": "2026-09-24T12:00:00.000Z"
}
```

### Agent identity

Agent IDs are derived from the container hostname when running inside Docker.

This allows multiple Agent instances to run without manually assigning unique IDs.

### Communication

Agents publish events to RabbitMQ using the following topology:

```text
Agent
  │
  ▼
event-pulse.events (exchange)
  │
  │ routing key: event
  ▼
event-pulse.process (queue)
```

The exchange, queue, and binding are declared by the application at startup, so no manual RabbitMQ configuration is required.

## Process

The Process service consumes events from RabbitMQ, validates and persists them in MongoDB, evaluates applicable rules, and stores historical rule matches.

Every incoming event is persisted in the `events` collection using its unique `eventId`.

Rule matches are persisted separately in the `rule_matches` collection. A rule match contains a snapshot of the rule configuration at the time the match occurred, allowing historical matches to remain meaningful even if the rule is later updated or deleted.

### Rule management

Rules can be created, updated, retrieved, and deleted through the Process REST API.

Each rule consists of:

- Name
- Event type
- Comparison operator
- Threshold value

Supported operators:

```text
>
>=
<
<=
=
```

### Reporting

The Process service provides reporting endpoints based on historical rule matches.

#### Rule occurrences

```http
GET /rules/:ruleId/occurrences?from=<ISO_DATE>&to=<ISO_DATE>
```

Returns occurrence timestamps grouped by agent for a requested time range. The requested range cannot exceed 24 hours.

Example:

```json
{
	"ruleId": "6ab65d51cd101ddedbfe847e",
	"from": "2026-09-24T00:00:00.000Z",
	"to": "2026-09-24T23:59:59.999Z",
	"agents": [
		{
			"agentId": "0df4a062e1b2",
			"occurrences": ["2026-09-24T10:15:20.000Z", "2026-09-24T10:15:22.000Z"]
		}
	]
}
```

#### Rule occurrence counts

```http
GET /rules/:ruleId/statistics
```

Returns the total number of historical occurrences for the rule, grouped by agent and ordered by occurrence count.

Example:

```json
{
	"ruleId": "6ab65d51cd101ddedbfe847e",
	"agents": [
		{
			"count": 551,
			"agentId": "0df4a062e1b2"
		},
		{
			"count": 546,
			"agentId": "ef144e934fab"
		}
	]
}
```

These reports are calculated directly from MongoDB's historical `rule_matches` data.

## API documentation

The Process service exposes Swagger documentation at:

```text
http://localhost:3000/docs
```

The Swagger UI provides interactive documentation for the available REST endpoints.

## Communication

Agents publish events to RabbitMQ using the following topology:

```text
Agent
  │
  ▼
event-pulse.events (exchange)
  │
  │ routing key: event
  ▼
event-pulse.process (queue)
```

The exchange, queue, and binding are declared by the application at startup, so no manual RabbitMQ configuration is required.

### RabbitMQ availability

The Agent does not implement persistent local buffering or storage for generated events.

This is intentional because the assignment specifies that Agents should not have a database or other persistent storage. As a result, if RabbitMQ is temporarily unavailable, an event generated during that period cannot be persisted by the Agent and will be lost.

In a production IoT or event-ingestion system, losing events during a temporary broker outage would generally be undesirable. A typical approach would be to introduce a **store-and-forward mechanism** on the Agent side. For example, the Agent could temporarily persist unpublished events to a local durable queue, embedded database, or disk-backed log and retry publishing them when RabbitMQ becomes available again. Depending on the reliability requirements, the Agent could also use bounded buffering, exponential backoff, and monitoring/alerting to prevent unbounded local storage growth.

Another option would be to place a highly available messaging layer in front of the processing system and configure appropriate publisher acknowledgements and delivery guarantees.

These mechanisms are intentionally not implemented in this project because they would require persistent storage or additional infrastructure on the Agent side, which is outside the assignment's constraints. The current implementation therefore prioritizes the required stateless Agent design over guaranteed event preservation during RabbitMQ downtime.
