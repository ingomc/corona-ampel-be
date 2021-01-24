import fetch from "node-fetch";
import fs from "fs";

const dir = "./build/county/";

const endpoint =
  "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?outFields=RS,AGS,OBJECTID&returnGeometry=false&f=json&outSR=4326&where=1=1";

const getEndpointCounty = (RS) =>
  `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?outFields=*&returnGeometry=false&f=json&outSR=4326&where=RS=${RS}`;

const getEndpointIts = (AGS) =>
  `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/DIVI_Intensivregister_Landkreise/FeatureServer/0/query?f=json&where=AGS%3D%27${AGS}%27&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*`;

// Empty Json, gets filled and written to disk

// called inside fetch, fetches new cases, pushes to json
const handleData = async (locationData) => {
  // Get all Stats
  let allData = await fetch(getEndpointCounty(locationData.RS))
    .then((res) => res.json())
    .then((_json) => {
      // console.log(_json.features[0].attributes);
      return _json.features[0].attributes;
    })
    .catch((error) => {
      console.log(
        "\x1b[31m%s\x1b[0m",
        ` x fetch(getEndpointCounty: ${locationData.RS}`
      );
    });

  // Get ITS Stats
  // console.log();
  let itsData = await fetch(getEndpointIts(locationData.AGS))
    .then((res) => res.json())
    .then((_json) => {
      // console.log(_json.features[0]);
      return _json.features[0];
    })
    .catch((error) => {
      console.log(
        "\x1b[31m%s\x1b[0m",
        ` x fetch(getEndpointIts: ${locationData.AGS}`
      );
      console.log(getEndpointIts(locationData.AGS));
      console.log(getEndpointIts(error));
    });

  let itsDataFinalJson = {
    betten_frei: null,
    betten_belegt: null,
    betten_gesamt: null,
    Anteil_betten_frei: null,
    faelle_covid_aktuell: null,
    faelle_covid_aktuell_beatmet: null,
    Anteil_covid_beatmet: null,
    Anteil_COVID_betten: null,
    daten_stand: null,
  };
  // console.log(itsData);

  if (typeof itsData !== "undefined") {
    itsDataFinalJson = {
      betten_frei: itsData.attributes.betten_frei,
      betten_belegt: itsData.attributes.betten_belegt,
      betten_gesamt: itsData.attributes.betten_gesamt,
      Anteil_betten_frei: itsData.attributes.Anteil_betten_frei,
      faelle_covid_aktuell: itsData.attributes.faelle_covid_aktuell,
      faelle_covid_aktuell_beatmet:
        itsData.attributes.faelle_covid_aktuell_beatmet,
      Anteil_covid_beatmet: itsData.attributes.Anteil_covid_beatmet,
      Anteil_COVID_betten: itsData.attributes.Anteil_COVID_betten,
      daten_stand: itsData.attributes.daten_stand,
    };
  }

  const finalJson = { data: [] };

  finalJson.data.push({
    ...itsDataFinalJson,
    ...allData,
  });

  if (!fs.existsSync(dir)) {
    fs.mkdir(dir, { recursive: true }, (err) => {
      if (err) throw err;
    });
  }
  fs.writeFileSync(`${dir}${locationData.RS}.json`, JSON.stringify(finalJson));
  // console.log(
  //   '\x1b[42m\x1b[30m%s\x1b[0m',
  //   ` ✔  Datei gespeichert: ${dir}`,
  // );
};

// fetch data from api, and iterate over countys
fetch(endpoint)
  .then((res) => res.json())
  .then(async (_json) => {
    // console.log(endpoint);
    // console.log(_json);
    await Promise.all(
      _json.features.map(async (_location) => {
        await handleData(_location.attributes);
      })
    );
  })
  .then(() => {
    console.log("\x1b[42m\x1b[30m%s\x1b[0m", ` ✔  ======== FERTIG ===========`);
  })
  .catch((error) => {
    console.log("\x1b[31m%s\x1b[0m", ` x fetch(endpoint)`);
    console.log(error);
  });
