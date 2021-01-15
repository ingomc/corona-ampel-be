# Corona-Ampel-Backend



### Übersicht alle Landkreise
```
https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?outFields=last_update%2CRS%2Ccases7_per_100k%2CGEN%2CBEZ&returnGeometry=false&f=json&outSR=4326&where=1=1
```

### Einzelnes County:
```
https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?outFields=*&returnGeometry=false&f=json&outSR=4326&where=RS=12063
```

### Intensivstation-Statistik:
```
https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/DIVI_Intensivregister_Landkreise/FeatureServer/0/query?f=json&where=AGS%3D%2701001%27&returnGeometry=false&spatialRel=esriSpatialRelIntersects&geometry=%7B%22xmin%22%3A405955.5271232863%2C%22ymin%22%3A5873740.100125852%2C%22xmax%22%3A1222914.4854350328%2C%22ymax%22%3A7507658.016749346%2C%22spatialReference%22%3A%7B%22wkid%22%3A102100%7D%7D&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&orderByFields=betten_belegt%20desc&outSR=102100&resultOffset=0&resultRecordCount=25&resultType=standard&cacheHint=false
```
