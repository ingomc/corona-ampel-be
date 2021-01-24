import fetch from "node-fetch";
import fs from "fs";

console.log("Fetching Start");
const dir = "./build/countys/";
const file = "index.json";

const endpoint =
  "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?outFields=RS%2Clast_update%2CRS%2Ccases7_per_100k%2CGEN%2CBEZ&returnGeometry=false&f=json&outSR=4326&where=1=1&orderByFields=RS%20desc";

const getNewCasesUrl = (RS) =>
  `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?f=json&where=(NeuerFall%20IN(1%2C%20-1))%20AND%20(IdLandkreis%3D%27${RS}%27)&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22%2C%22onStatisticField%22%3A%22AnzahlFall%22%2C%22outStatisticFieldName%22%3A%22value%22%7D%5D&resultType=standard&cacheHint=true`;

// Empty Json, gets filled and written to disk
const finalJson = {
  locations: [],
};

// called inside fetch, fetches new cases, pushes to json
const handleData = async (locationData) => {
  const newCases = await fetch(getNewCasesUrl(locationData.RS))
    .then((res) => res.json())
    .then((_json) => _json.features[0].attributes.value)
    .catch((error) => {
      console.log(
        "\x1b[31m%s\x1b[0m",
        ` x Error fetching handleData: fetch(getNewCasesUrl)`
      );
      console.log(error);
    });

  finalJson.date = locationData.last_update;

  delete locationData.last_update; // we dont need it per county
  locationData.cases7_per_100k = Number(
    locationData.cases7_per_100k.toFixed(1)
  );

  finalJson.locations.push({
    ...locationData,
    newCases,
  });
};

// fetch data from api, and iterate over countys
fetch(endpoint)
  .then((res) => res.json())
  .then(async (_json) => {
    await Promise.all(
      _json.features.map(async (_location) => {
        await handleData(_location.attributes);
      })
    );

    if (!fs.existsSync(dir)) {
      fs.mkdir(dir, { recursive: true }, (err) => {
        if (err) throw err;
      });
    }
    finalJson.locations.sort((a, b) => {
      return a.RS - b.RS;
    });
    fs.writeFileSync(`${dir}${file}`, JSON.stringify(finalJson));
    console.log(
      "\x1b[42m\x1b[30m%s\x1b[0m",
      ` ✔  Datei gespeichert: ${dir}${file}`
    );
  })
  .catch((error) => {
    console.log("\x1b[31m%s\x1b[0m", ` x Error fetching fetch(endpoint)`);
    console.log(error);
  });
