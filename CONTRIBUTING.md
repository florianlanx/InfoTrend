# Contributing to InfoTrend

First off, thank you for considering contributing to InfoTrend! It's people like you that make InfoTrend such a great tool.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Include your browser version and OS**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the proposed feature**
- **Explain why this enhancement would be useful**
- **List any alternatives you've considered**

### Adding New Data Sources

We especially welcome contributions of new data sources! Please refer to [SOURCE_INTEGRATION.md](SOURCE_INTEGRATION.md) for detailed instructions on:

- BaseSource API reference
- Code examples
- Common patterns (JSON API, RSS, HTML scraping)
- Best practices

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes** and ensure the code follows our style guidelines
4. **Test your changes** thoroughly
5. **Update documentation** if needed
6. **Submit a pull request**

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/info-trend-chrome-extension.git
cd info-trend-chrome-extension

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

### Loading the Extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` directory

## Style Guidelines

### Code Style

- Use TypeScript for all new code
- Follow existing code patterns and naming conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests when relevant

Example:
```
Add Reddit data source integration

- Implement RedditSource class extending BaseSource
- Add configuration options for subreddit selection
- Include rate limiting to respect API guidelines

Closes #123
```

### TypeScript Guidelines

- Prefer interfaces over type aliases for object shapes
- Use strict null checks
- Avoid `any` type when possible
- Export types that are used across multiple files

## Project Structure

```
src/
├── background/       # Service worker and background scripts
├── components/       # React components
├── hooks/           # Custom React hooks
├── i18n/            # Internationalization
├── options/         # Settings page
├── services/        # Business logic services
├── sources/         # Data source implementations
├── stores/          # Zustand state stores
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Testing

Before submitting a PR, please ensure:

- [ ] The extension builds without errors (`npm run build`)
- [ ] No linting errors (`npm run lint`)
- [ ] The extension loads correctly in Chrome
- [ ] Your feature works as expected
- [ ] Existing features still work

## Documentation

- Update the README.md if you change functionality
- Add JSDoc comments for public APIs
- Update SOURCE_INTEGRATION.md if you modify the data source architecture

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing! 🎉
