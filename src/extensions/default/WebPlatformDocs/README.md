# Updating the Docs
Use the Node script [update-wpd-docs](https://github.com/MarcelGerber/update-wpd-docs) to update the `css.json` contents:

1. Download/clone the repo
2. Run `npm install`
3. Download [Brackets' config.json](https://github.com/MarcelGerber/update-wpd-docs/blob/brackets-config/config.json)
4. Check if the path in the `config.json` (`aliases.html.output` & `aliases.css.output`) is correct. It should point to your very own Brackets repo.
5. Run

        [sudo] node update-wpd-docs css
        [sudo] node update-wpd-docs html
