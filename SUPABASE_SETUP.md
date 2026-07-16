This project has been updated to use Supabase CLI for local development. The Supabase CLI allows you to:

1. **Initialize and manage your Supabase project** using configuration files
2. **Run migrations and seed data** through CLI commands
3. **Set environment variables** through .env files
4. **Deploy to Supabase** when ready

## Setup CLI

The project uses Supabase CLI commands for database management. To set up everything through the CLI, run these commands:

```bash
# Initialize a new Supabase project (if not already initialized)
supabase init

# Link to your Supabase project (if you have a remote project)
supabase link --project-ref <your-project-ref>

# Run database migrations
supabase db push

# Run seed data
supabase db seed

# Start the development server
npm run dev
```

## Project Structure

- `supabase/` - Supabase project configuration
  - `config.toml` - Configuration for local Supabase
  - `schemas/` - Database schema definitions
  - `seed.sql` - Seed data for initial population
- `server.ts` - Express server with PostgreSQL integration for media endpoints
- `.env.example` - Environment variable template

## Key CLI Features

1. **Database Connection**: The server connects to a PostgreSQL database using credentials from environment variables
2. **CLI-Controlled Migrations**: All database schema changes are managed through Supabase CLI
3. **CLI-Controlled Seeding**: Initial data is loaded via CLI seed command
4. **Environment Configuration**: All configuration is set through CLI/config files

## Development Workflow

1. Use CLI commands to manage your database
2. Set environment variables in `.env` file
3. Run `npm run dev` to start the server
4. The server automatically uses the database set up through CLI

The CLI setup ensures consistent database management across development and production environments.
