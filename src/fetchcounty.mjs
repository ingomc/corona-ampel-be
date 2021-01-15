import fetch from "node-fetch";
import fs from "fs";

const dir = "./build/county/";

const endpoint =
  "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?outFields=RS&returnGeometry=false&f=json&outSR=4326&where=1=1";

const getEndpointCounty = (RS) =>
  `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?outFields=*&returnGeometry=false&f=json&outSR=4326&where=RS=${RS}`;

const getEndpointIts = (RS) =>
  `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/DIVI_Intensivregister_Landkreise/FeatureServer/0/query?f=json&where=AGS%3D%27${RS}%27&returnGeometry=false&spatialRel=esriSpatialRelIntersects&geometry=%7B%22xmin%22%3A405955.5271232863%2C%22ymin%22%3A5873740.100125852%2C%22xmax%22%3A1222914.4854350328%2C%22ymax%22%3A7507658.016749346%2C%22spatialReference%22%3A%7B%22wkid%22%3A102100%7D%7D&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&orderByFields=betten_belegt%20desc&outSR=102100&resultOffset=0&resultRecordCount=25&resultType=standard&cacheHint=false`;

// Empty Json, gets filled and written to disk

// called inside fetch, fetches new cases, pushes to json
const handleData = async (locationData) => {
  // Get all Stats
  let allData = await fetch(getEndpointCounty(locationData.RS))
    .then((res) => res.json())
    .then((_json) => _json.features[0].attributes);

// Get ITS Stats
  let itsData = await fetch(getEndpointIts(locationData.RS))
    .then((res) => res.json())
    .then((_json) => _json.features[0]);

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

  const finalJson = {data: []};

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
  });
