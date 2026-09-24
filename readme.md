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
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
                MongoDB       Redis       Rule Matching
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
