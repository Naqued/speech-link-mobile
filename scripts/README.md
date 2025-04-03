# Translation Scripts

This directory contains scripts to help manage translations in the Speech Link application.

## Available Scripts

### add-translation-keys.js

This script adds missing translation keys to all language files in the `src/i18n/locales` directory.

Currently, it adds the following keys:
- `voice.actions.success`
- `voice.actions.voiceSelected`
- `voice.actions.errorSelectingVoice`

#### Usage

```bash
# From the project root
node scripts/add-translation-keys.js
```

### translation-helper.js

The translation helper script provides utilities for managing translations.

#### Usage

```bash
# From the project root
node scripts/translation-helper.js
```

## Adding New Translations

When adding new features that require translations:

1. Add the translations to the English locale first (`en.json`)
2. Either manually add translations to other locales or create a script similar to `add-translation-keys.js`
3. Run the script to update all language files
4. Document the new translations in the language tracker (`docs/language-implementation-tracker.md`)

## Translation Conventions

- Use kebab-case for translation keys
- Group related translations under a common namespace
- Include placeholders for dynamic content using double curly braces: `{{variable}}`
- Test translations in the context they'll be used in 