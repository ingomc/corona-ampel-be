import fetch from "node-fetch";
import fs from "fs";
import moment from "moment";

const dir = "./build/global/";
const file = "index.json";

const endpointIncidenceGermany =
  "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19_Landkreise_Table_Demo_18b5f806160a4aa686ca65819fbe4462/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=last_update,EWZ,cases,cases7_per_100k&orderByFields=RS%20asc&resultOffset=0&resultRecordCount=1&resultType=standard&cacheHint=true";
const endpointNewCasesGermany =
  "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?f=json&where=NeuerFall%20IN(1%2C%20-1)&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22%2C%22onStatisticField%22%3A%22AnzahlFall%22%2C%22outStatisticFieldName%22%3A%22value%22%7D%5D&resultType=standard&cacheHint=true";
const endpointNewDeathsGermany =
  "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?f=json&where=NeuerTodesfall%20IN(1%2C%20-1)&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22%2C%22onStatisticField%22%3A%22AnzahlTodesfall%22%2C%22outStatisticFieldName%22%3A%22value%22%7D%5D&resultType=standard&cacheHint=true";

const endpointGlobal = "https://disease.sh/v3/covid-19/all?yesterday=true";

const finalJson = {
  global: {},
  germany: {},
};

// german incidence
await fetch(endpointIncidenceGermany)
  .then((res) => res.json())
  .then(async (_json) => {
    finalJson.germany = {
      ..._json.features[0].attributes,
    };
  })
  .then(() => {
    console.log("\x1b[42m\x1b[30m%s\x1b[0m", ` ✔  endpointIncidenceGermany`);
  })
  .catch((error) => {
    console.log("\x1b[31m%s\x1b[0m", ` x fetch(endpointIncidenceGermany)`);
    console.log(error);
  });

// new cases germany
await fetch(endpointNewCasesGermany)
  .then((res) => res.json())
  .then(async (_json) => {
    finalJson.germany.newCases = _json.features[0].attributes.value;
  })
  .then(() => {
    console.log("\x1b[42m\x1b[30m%s\x1b[0m", ` ✔  endpointNewCasesGermany`);
  })
  .catch((error) => {
    console.log("\x1b[31m%s\x1b[0m", ` x fetch(endpointNewCasesGermany)`);
    console.log(error);
  });

// new deaths germany
await fetch(endpointNewDeathsGermany)
  .then((res) => res.json())
  .then(async (_json) => {
    finalJson.germany.newDeaths = _json.features[0].attributes.value;
  })
  .then(() => {
    console.log("\x1b[42m\x1b[30m%s\x1b[0m", ` ✔  endpointNewDeathsGermany`);
  })
  .catch((error) => {
    console.log("\x1b[31m%s\x1b[0m", ` x fetch(endpointNewDeathsGermany)`);
    console.log(error);
  });

// new deaths germany
await fetch(endpointGlobal)
  .then((res) => res.json())
  .then(async (_json) => {

    finalJson.global = {
      ..._json,
    };
    finalJson.global.last_update =`${moment(_json.updated).format(
        "DD.MM., HH:mm"
      )} Uhr`;
  })
  .then(() => {
    console.log("\x1b[42m\x1b[30m%s\x1b[0m", ` ✔  endpointGlobal`);
  })
  .catch((error) => {
    console.log("\x1b[31m%s\x1b[0m", ` x fetch(endpointGlobal)`);
    console.log(error);
  });

// console.log(finalJson);

if (!fs.existsSync(dir)) {
  fs.mkdir(dir, { recursive: true }, (err) => {
    if (err) throw err;
  });
}
fs.writeFileSync(`${dir}${file}`, JSON.stringify(finalJson));
console.log(
  "\x1b[42m\x1b[30m%s\x1b[0m",
  ` ✔  Datei gespeichert: ${dir}${file}`
);
