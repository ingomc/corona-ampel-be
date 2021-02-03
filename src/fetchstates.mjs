import fetch from "node-fetch";
import fs from "fs";
import moment from "moment";

console.log("Fetching States Start");
const dir = "./build/states/";
const file = "index.json";

const endpoint =
  "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/Coronaf%C3%A4lle_in_den_Bundesl%C3%A4ndern/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=OBJECTID,LAN_ew_AGS,LAN_ew_GEN,LAN_ew_BEZ,LAN_ew_EWZ,Fallzahl,Aktualisierung,Death,cases7_bl_per_100k,cases7_bl,death7_bl&orderByFields=LAN_ew_GEN%20asc&cacheHint=true02100&resultOffset=0&resultRecordCount=25&resultType=standard&cacheHint=true";
const getEndpointNewCases = (state) => {
  return `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?f=json&where=(NeuerFall%20IN(1%2C%20-1))%20AND%20(Bundesland%3D%27${state}%27)&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22%2C%22onStatisticField%22%3A%22AnzahlFall%22%2C%22outStatisticFieldName%22%3A%22value%22%7D%5D&resultType=standard&cacheHint=true`;
};
const getEndpointNewDeaths = (state) => {
  return `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?f=json&where=(NeuerTodesfall%20IN(1%2C%20-1))%20AND%20(Bundesland%3D%27${state}%27)&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22%2C%22onStatisticField%22%3A%22AnzahlTodesfall%22%2C%22outStatisticFieldName%22%3A%22value%22%7D%5D&resultType=standard&cacheHint=true`;
};

// Todo: neue fälle heute, neue tode

// Empty Json, gets filled and written to disk
const finalJson = {
  locations: [],
};

// called inside fetch, fetches new cases, pushes to json
const handleData = async (stateData) => {
  // LAN_ew_GEN

  const newCases = await fetch(
    getEndpointNewCases(encodeURI(stateData.LAN_ew_GEN))
  )
    .then((res) => res.json())
    .then((_json) => _json.features[0].attributes.value)
    .catch((error) => {
      console.log(
        "\x1b[31m%s\x1b[0m",
        ` x Error fetching handleData: fetch(getEndpointNewCases)`
      );
      console.log(error);
    });

  const newDeaths = await fetch(
    getEndpointNewDeaths(encodeURI(stateData.LAN_ew_GEN))
  )
    .then((res) => res.json())
    .then((_json) => _json.features[0].attributes.value)
    .catch((error) => {
      console.log(
        "\x1b[31m%s\x1b[0m",
        ` x Error fetching handleData: fetch(getEndpointNewDeaths)`
      );
      console.log(error);
    });

  stateData.last_update = `${moment(stateData.Aktualisierung).format(
    "DD.MM., HH:mm"
  )}`;
  finalJson.last_update = stateData.last_update;

  delete stateData.Aktualisierung; // no good name

  finalJson.locations.push({
    ...stateData,
    new_cases: newCases,
    new_deaths: newDeaths,
  });
};

// fetch data from api, and iterate over states
fetch(endpoint)
  .then((res) => res.json())
  .then(async (_json) => {
    await Promise.all(
      _json.features.map(async (_state) => {
        await handleData(_state.attributes);
      })
    );

    if (!fs.existsSync(dir)) {
      fs.mkdir(dir, { recursive: true }, (err) => {
        if (err) throw err;
      });
    }
    // Sort
    finalJson.locations.sort((a, b) => {
      return a.cases7_bl_per_100k - b.cases7_bl_per_100k;
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
