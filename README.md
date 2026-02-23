# Icon Folder Yaml

Intended to be used with [Iconize](https://github.com/FlorianWoelki/obsidian-iconize) OR [Iconic](https://github.com/gfxholo/iconic/) with [Mkdocs Material](https://squidfunk.github.io/mkdocs-material/reference/#setting-the-page-icon) (icons) and [Enveloppe](https://enveloppe.ovh/).

The idea is to add keys into the frontmatter:
- `icon` : `folderIcon/icon`
- `icon_file` : `[[iconFile]]` (only if the svg is not in `.obsidian` or other hidden folder)

Enveloppe will send the `icon_file` into your Repository, and Mkdocs Material will use the `icon` key to display the icon.


## ⚙️ Usage

The plugin add a command to the command palette: `Iconize assistant : Add icon to frontmatter`

## 📥 Installation

- [ ] From Obsidian's community plugins
- [x] Using BRAT with `https://github.com/mara-li/iconize-assistant`  
      → Paste this into your browser : `obsidian://brat?plugin=https://github.com/mara-li/iconize-assistant`
- [x] From the release page:
      - Download the latest release
      - Unzip `icon-folder-yaml.zip` in `.obsidian/plugins/` path
      - In Obsidian settings, reload the plugin
      - Enable the plugin

## 🤖 Developing

To make changes to this plugin, first ensure you have the dependencies installed.

```
bun install
```

To start building the plugin with what mode enabled run the following command:

```
bun run dev
```

> **Note**
> If you haven't already installed the hot-reload-plugin you'll be prompted to. You need to enable that plugin in your obsidian vault before hot-reloading will start. You might need to refresh your plugin list for it to show up.
> To start a release build run the following command:

```
bun run build
```

> **Note**
> You can use the `.env` file with adding the key `VAULT_DEV` to specify the path to your Obsidian (development) vault. This will allow you to test your plugin without specify each times the path to the vault.

