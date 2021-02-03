import fetch from "node-fetch";
import fs from "fs";
import moment from "moment";

console.log("Fetching Start");
const dir = "./build/browse/";
const file = "index.json";

const endpoint =
  "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?outFields=cases_per_100k%2CRS%2CEWZ%2Clast_update%2CRS%2Ccases7_per_100k%2CGEN%2CBEZ&returnGeometry=false&f=json&outSR=4326&where=1=1&orderByFields=RS%20desc";

const getNewCasesUrl = (RS) =>
  `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?f=json&where=(NeuerFall%20IN(1%2C%20-1))%20AND%20(IdLandkreis%3D%27${RS}%27)&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22%2C%22onStatisticField%22%3A%22AnzahlFall%22%2C%22outStatisticFieldName%22%3A%22value%22%7D%5D&resultType=standard&cacheHint=true`;

// Empty Json, gets filled and written to disk
const tempJson = {
  locations: [],
};

const finalJson = {};

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

  // reformat date
  locationData.last_update = moment(
    locationData.last_update.split(" U"),
    "DD.MM.YYYY, HH:mm"
  ).format("DD.MM., HH:mm");
  tempJson.date = locationData.last_update;

  delete locationData.last_update; // we dont need it per county
  locationData.cases7_per_100k = Number(
    locationData.cases7_per_100k.toFixed(1)
  );

  tempJson.locations.push({
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
    tempJson.locations.sort((a, b) => {
      return a.cases7_per_100k - b.cases7_per_100k;
    });
    finalJson.lowest5 = tempJson.locations.splice(0, 5);
    finalJson.highest5 = tempJson.locations.splice(
        tempJson.locations.length - 4,
      tempJson.locations.length
    ).reverse();

    tempJson.locations.sort((a, b) => {
      return a.EWZ - b.EWZ;
    });
    finalJson.highest5EWZ = tempJson.locations.splice(
        tempJson.locations.length - 4,
      tempJson.locations.length
    ).reverse();

    tempJson.locations.sort((a, b) => {
      return a.cases_per_100k - b.cases_per_100k;
    });
    finalJson.highest5casesPer100k = tempJson.locations.splice(
        tempJson.locations.length - 4,
      tempJson.locations.length
    ).reverse();

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
