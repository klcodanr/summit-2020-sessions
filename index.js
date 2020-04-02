const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fetch = require("node-fetch");

const writeCsv = async function(sessions) {
  var dist = __dirname + "/dist";
  if (!fs.existsSync(dist)) {
    fs.mkdirSync(dist);
  }
  const out = dist + "/summit-sessions.csv";

  const csvWriter = createCsvWriter({
    path: out,
    header: [
      { id: "title", title: "Title" },
      { id: "description", title: "Description" },
      { id: "category", title: "Category" },
      { id: "tags", title: "Tags" },
      { id: "thumbnail", title: "Thumbnail" },
      { id: "link", title: "Link" }
    ]
  });

  const records = [];
  sessions.forEach(session => {
    records.push({
      title: session.title,
      description: session.description,
      category: session.summitTagTitle,
      tags: session.tags.map(t => t.title).join(","),
      thumbnail: session.backgroundImage,
      link: session.cta[0].href
    });
  });

  await csvWriter.writeRecords(records);
  console.log(`Wrote ${records.length} sessions to ${out}`);
};

const writeHtml = async function(sessions){
  const categories = new Set();
  const doc = [];
  sessions.forEach(session => categories.add(session.summitTagTitle));
  doc.push("<ul>");
  Array.from(categories).sort().forEach(category => {
    doc.push(`<li><a href="#${category.toLowerCase().replace(/ |\&/g,'-')}">${category.replace('&', '&amp;')}</a></li>`);
  });
  doc.push("</ul>");
  Array.from(categories).sort().forEach(category => {
    doc.push(`<h3 id="${category.toLowerCase().replace(/ |\&/g,'-')}">${category.replace('&', '&amp;')}</h3><br/>`);
    sessions.filter(s => s.summitTagTitle === category).forEach(session => {
      doc.push(`<h4><a rel="noopener noreferrer" href="${session.cta[0].href}" target="_blank">${session.title.replace('&','&amp;')}</a></h4>`);
      doc.push(`<p>${session.description.replace('&','&amp;')}</p><br/>`);
    });
  });
  fs.writeFileSync('dist/summit-sessions.html', doc.join('\n'));
}

fetch(
  "https://www.adobe.com/www-fragments/summit/innovation-tracks/master.cardcollection.json/results-6.json"
)
  .then(res => res.json())
  .then(data => {
    const sessions = data.cards;
    writeCsv(sessions);
    writeHtml(sessions);
    fs.writeFileSync('dist/summit-sessions.json', JSON.stringify(data, null, 2));
  });
