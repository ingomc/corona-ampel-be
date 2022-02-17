import fetch from "node-fetch";
import fs from "fs";
import moment from "moment";

console.log("Fetching States Start");
const dir = "./build/states/";
const file = "index.json";

const endpoint =
  "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/Coronaf%C3%A4lle_in_den_Bundesl%C3%A4ndern/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=OBJECTID,AdmUnitId,LAN_ew_AGS,LAN_ew_GEN,LAN_ew_BEZ,LAN_ew_EWZ,Fallzahl,Aktualisierung,Death,cases7_bl_per_100k,cases7_bl,death7_bl&orderByFields=LAN_ew_GEN%20asc&cacheHint=true02100&resultOffset=0&resultRecordCount=25&resultType=standard&cacheHint=true";

const getEndpointNewCases = (AdmUnitId) => {
  return `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/rki_key_data_blbrdv/FeatureServer/0/query?f=json&where=(AnzAktivNeu%3C%3E0)%20AND%20(AdmUnitId%3D${AdmUnitId})&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=AdmUnitId%20asc&resultOffset=0&resultRecordCount=1&resultType=standard&cacheHint=true`;
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
    getEndpointNewCases(encodeURI(stateData.AdmUnitId))
  )
    .then((res) => res.json())
    .then((_json) => _json.features[0].attributes.AnzFallNeu)
    .catch((error) => {
      console.log(
        "\x1b[31m%s\x1b[0m",
        ` x Error fetching handleData: fetch(getEndpointNewCases)`
      );
      console.log(error);
      throw new Error(
        " x Error fetching handleData: fetch(getEndpointNewCases)"
      );
    });

  const newDeaths = await fetch(
    getEndpointNewCases(encodeURI(stateData.AdmUnitId))
  )
    .then((res) => res.json())
    .then((_json) => _json.features[0].attributes.AnzTodesfallNeu)
    .catch((error) => {
      console.log(
        "\x1b[31m%s\x1b[0m",
        ` x Error fetching handleData: fetch(getEndpointNewDeaths)`
      );
      console.log(error);
      throw new Error(
        "x Error fetching handleData: fetch(getEndpointNewDeaths)"
      );
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
