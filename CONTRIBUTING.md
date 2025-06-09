# Contributing to Browser Connect MCP

Thank you for your interest in contributing to Browser Connect MCP! This guide will help you get started.

## How to Contribute

### Reporting Issues

1. **Check existing issues** first to avoid duplicates
2. **Use issue templates** when available
3. **Include details**:
   - Your environment (OS, Node version, Chrome version)
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages or logs

### Suggesting Features

1. **Open a discussion** first for major features
2. **Explain the use case** - why is this feature needed?
3. **Consider implementation** - how might it work?

### Contributing Code

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes**
4. **Write/update tests** if applicable
5. **Run tests**: `npm test`
6. **Lint your code**: `npm run lint`
7. **Commit with clear messages**
8. **Push and create a Pull Request**

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/browser-connect-mcp.git
cd browser-connect-mcp

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

## Code Guidelines

### TypeScript

- Use TypeScript's strict mode
- Define proper types (avoid `any`)
- Document complex functions with JSDoc

### Code Style

- Follow existing patterns in the codebase
- Use meaningful variable names
- Keep functions focused and small
- Add comments for complex logic

### Testing

- Write tests for new features
- Ensure existing tests pass
- Test edge cases

### Commits

- Use clear, descriptive commit messages
- Follow conventional commits format:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `test:` for tests
  - `refactor:` for refactoring

Example: `feat: add WebSocket debugging support`

## Pull Request Process

1. **Update documentation** if needed
2. **Ensure all tests pass**
3. **Update the README** if you've added functionality
4. **Link related issues** in the PR description
5. **Be responsive** to feedback

## MCP Tool Guidelines

When adding new tools:

1. **Follow MCP conventions**:
   - Tools should have clear, descriptive names
   - Use appropriate input/output schemas
   - Handle errors gracefully

2. **Consider the user experience**:
   - How will users invoke this through natural language?
   - What permissions might be needed?
   - What are common use cases?

3. **Document thoroughly**:
   - Add the tool to README
   - Include usage examples
   - Update type definitions

## Questions?

- Open a [GitHub Discussion](https://github.com/perception30/browser-connect-mcp/discussions)
- Check existing issues and PRs
- Review the [MCP documentation](https://modelcontextprotocol.io)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.