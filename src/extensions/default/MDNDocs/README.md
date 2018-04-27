# Updating the Docs
* Use the Node script [scrape-mdn](https://github.com/mozilla/brackets/tree/master/src/extensions/extra/MDNDocs/tools/scrape-mdn) to update the `css.json` and `html.json` contents:
* Both the JSON files will have URL and Summary, but for css.json we need to have possible values of each css property along with small description, so use this Node script [MDNDocsScrapper](https://github.com/saurabh95/MDNDocsScrapper), this takes css.json as input and then creates a newcss.json with the desired content.
