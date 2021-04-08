import fetch from "node-fetch";
import fs from "fs";
import moment from "moment";

let errors = [];

const dir = "./build/global/";
const file = "index.json";

const endpointIncidenceGermany =
  "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/rki_key_data_blbrdv/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=AdmUnitId%20asc&resultOffset=0&resultRecordCount=1&resultType=standard&cacheHint=true";
const endpointLastUpdate =
  "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?outFields=last_update&returnGeometry=false&f=json&outSR=4326&where=RS=07135";


const endpointGlobal = "https://disease.sh/v3/covid-19/all?yesterday=true";

const finalJson = {
  global: {},
  germany: {},
};

// german incidence
await fetch(endpointIncidenceGermany)
  .then((res) => res.json())
  .then(async (_json) => {
    const data = _json.features[0].attributes;
    finalJson.germany = {
      "last_update":data["AnzFall"],
    "EWZ": 83166711,
    "cases": data["AnzFall"],
    "cases7_per_100k":data["Inz7T"],
    "ObjectId": data["ObjectId"],
    "newCases": data["AnzFallNeu"],
    "newDeaths":data["AnzTodesfallNeu"] 
    };
  })
  .then(() => {
    console.log("\x1b[42m\x1b[30m%s\x1b[0m", ` ✔  endpointIncidenceGermany`);
  })
  .catch((error) => {
    console.log("\x1b[31m%s\x1b[0m", ` x fetch(endpointIncidenceGermany)`);
    console.log(error);
    errors.push("x fetch(endpointIncidenceGermany)");
        // throw new Error("x fetch(endpointIncidenceGermany)");
  });

// last update
await fetch(endpointLastUpdate)
  .then((res) => res.json())
  .then(async (_json) => {
    const data = _json.features[0].attributes;
    finalJson.germany["last_update"] =  moment(
      data["last_update"].split(" U"),
      "DD.MM.YYYY, HH:mm"
    ).format("DD.MM., HH:mm")   ; 
  })
  .then(() => {
    console.log("\x1b[42m\x1b[30m%s\x1b[0m", ` ✔  endpointLastUpdate`);
  })
  .catch((error) => {
    console.log("\x1b[31m%s\x1b[0m", ` x fetch(endpointLastUpdate)`);
    console.log(error);
    errors.push("x fetch(endpointLastUpdate)");
        // throw new Error("x fetch(endpointLastUpdate)");
  });

// global
await fetch(endpointGlobal)
  .then((res) => res.json())
  .then(async (_json) => {
    finalJson.global = {
      ..._json,
    };
    finalJson.global.last_update = `${moment(_json.updated).format(
      "DD.MM., HH:mm"
    )}`;
  })
  .then(() => {
    console.log("\x1b[42m\x1b[30m%s\x1b[0m", ` ✔  endpointGlobal`);
  })
  .catch((error) => {
    console.log("\x1b[31m%s\x1b[0m", ` x fetch(endpointGlobal)`);
    console.log(error);
    errors.push("x  fetch(endpointGlobal)");
        // throw new Error("x  fetch(endpointGlobal)");
  });

// console.log(finalJson);

if (!fs.existsSync(dir)) {
  fs.mkdir(dir, { recursive: true }, (err) => {
    if (err) throw err;
  });
}
if (errors.length > 0) {
  errors.forEach(errormessage => console.log("\x1b[41m\x1b[30m%s\x1b[0m",errormessage));
} else {
  fs.writeFileSync(`${dir}${file}`, JSON.stringify(finalJson));
  console.log(
    "\x1b[42m\x1b[30m%s\x1b[0m",
    ` ✔  Datei gespeichert: ${dir}${file}`
  );

}
