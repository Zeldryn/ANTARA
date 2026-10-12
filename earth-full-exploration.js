"use strict";

(() => {
  const TERRARIUM_TEMPLATE = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
  const MAPZEN_SOURCE = "Mapzen Terrain Tiles · Amazon Public Dataset";
  const KM_PER_DEG_LAT = 111.32;
  const EARTH_RADIUS_KM = 6371.0088;
  const DEG = Math.PI / 180;
  const STATES = Object.freeze({
    IDLE: "idle",
    CONFIGURING: "configuring",
    SELECTING: "selecting",
    PREPARING: "preparing",
    ENTERING: "entering",
    ACTIVE: "active",
    EXITING: "exiting",
    ERROR: "error"
  });

  const EARTH_QUALITY_STORAGE_KEY = "antara-earth-graphics-quality-v2";
  const QUALITY_PROFILES = Object.freeze({
    LOW: Object.freeze({ name:"LOW", label:"RENDAH", description:"Performa terbaik", radius:2, maxDpr:1.18, minDpr:0.76, pixelBudget:2200000, anisotropy:3 }),
    MEDIUM: Object.freeze({ name:"MEDIUM", label:"SEDANG", description:"Seimbang", radius:2, maxDpr:1.45, minDpr:0.84, pixelBudget:4100000, anisotropy:7 }),
    HIGH: Object.freeze({ name:"HIGH", label:"TINGGI", description:"Visual terbaik", radius:2, maxDpr:1.72, minDpr:0.92, pixelBudget:6100000, anisotropy:12 })
  });
  const copyQualityProfile = name => ({ ...(QUALITY_PROFILES[name] || QUALITY_PROFILES.MEDIUM) });

  const REGIONS = Object.freeze([
    {
      id: "everest",
      name: "Everest / Himalaya",
      short: "Himalaya",
      latitude: 27.9881,
      longitude: 86.9253,
      zoom: 11,
      mode: "land",
      terrainStyle: "alpine",
      feature: "Puncak Everest",
      infoLabel: "GUNUNG · HIMALAYA",
      definition: "Puncak Everest adalah puncak gunung tertinggi di Bumi jika diukur dari permukaan laut. Puncaknya berada di Pegunungan Himalaya, tepat di perbatasan Nepal dan Tibet, Tiongkok.",
      sourceLabel: "Terrarium DEM · global SRTM / open elevation composite",
      sourceDetail: "Mapzen Terrain Tiles menggabungkan SRTM 30 m secara global bersama sumber elevasi terbuka lain. Bentuk terrain yang dirender berasal dari nilai elevasi tile, bukan noise procedural.",
      startAltitude: 3.2,
      maxClearance: 14,
      pitch: -0.22,
      yaw: 0.02,
      descriptor: "Kenali Everest dan relief Himalaya lewat punggungan tinggi, lembah dalam, dan medan bersalju.",
      educational: ["Everest berada di rangkaian Pegunungan Himalaya.", "Punggungan dan lembah membantu kita membaca bentuk pegunungan.", "Himalaya terbentuk karena tumbukan Lempeng India dan Eurasia."]
    },
    {
      id: "mariana",
      name: "Mariana / Challenger Deep",
      short: "Mariana",
      latitude: 11.35,
      longitude: 142.20,
      zoom: 10,
      mode: "underwater",
      terrainStyle: "abyss",
      feature: "Challenger Deep",
      infoLabel: "PALUNG LAUT · SAMUDRA PASIFIK",
      definition: "Challenger Deep adalah bagian terdalam yang diketahui di Palung Mariana, sebuah palung laut sangat dalam di Samudra Pasifik bagian barat. Di sini, dasar laut berada jauh di bawah permukaan laut.",
      sourceLabel: "Terrarium bathymetry · NOAA ETOPO1 composite",
      sourceDetail: "Mapzen memakai NOAA ETOPO1 untuk mengisi bathymetry. Nilai negatif dipertahankan sebagai kedalaman di bawah muka laut.",
      startAltitude: 9.0,
      startAbsoluteY: -1.1,
      maxClearance: 12,
      pitch: -0.16,
      yaw: 0.08,
      descriptor: "Turun ke Palung Mariana dan lihat bagaimana dasar samudra membentuk lembah panjang yang sangat dalam.",
      educational: ["Challenger Deep berada di dalam sistem Palung Mariana.", "Bathymetry adalah pemetaan bentuk dan kedalaman dasar laut.", "Palung Mariana berkaitan dengan proses subduksi lempeng tektonik."]
    },
    {
      id: "maunakea",
      name: "Mauna Kea / Hawaiʻi",
      short: "Mauna Kea",
      latitude: 19.8207,
      longitude: -155.4681,
      zoom: 10,
      mode: "coastal",
      terrainStyle: "volcanic",
      feature: "Mauna Kea",
      infoLabel: "GUNUNG API PERISAI · HAWAIʻI",
      definition: "Mauna Kea adalah gunung api perisai besar di Pulau Hawaiʻi. Bagian yang terlihat di atas laut hanyalah sebagian dari tubuh gunungnya, karena lerengnya terus berlanjut sampai ke dasar samudra.",
      sourceLabel: "Terrarium DEM + bathymetry · open elevation composite",
      sourceDetail: "Terrain mempertahankan elevasi darat dan nilai negatif bathymetry sehingga konteks gunung di atas serta di bawah muka laut dapat dijelaskan dalam satu model.",
      startAltitude: 3.0,
      maxClearance: 13,
      pitch: -0.24,
      yaw: -0.05,
      descriptor: "Ikuti Mauna Kea dari puncak hingga lerengnya dan pahami kenapa gunung ini tidak berhenti di garis pantai.",
      educational: ["Mauna Kea adalah gunung api perisai yang tumbuh dari dasar samudra.", "Muka laut membantu memisahkan bagian gunung yang terlihat dan yang berada di bawah air.", "Lerengnya yang luas merupakan ciri khas gunung api perisai."]
    },
    {
      id: "grandcanyon",
      name: "Grand Canyon",
      short: "Grand Canyon",
      latitude: 36.1069,
      longitude: -112.1129,
      zoom: 11,
      mode: "land",
      terrainStyle: "canyon",
      feature: "Grand Canyon",
      infoLabel: "NGARAI · ARIZONA, AMERIKA SERIKAT",
      definition: "Grand Canyon adalah ngarai raksasa di Arizona yang dipahat terutama oleh Sungai Colorado bersama proses erosi lainnya selama waktu geologi yang sangat panjang. Dindingnya membuka lapisan batuan dari masa yang berbeda.",
      sourceLabel: "Terrarium DEM · USGS/open elevation composite",
      sourceDetail: "Di Amerika Serikat Mapzen memasukkan data elevasi USGS resolusi tinggi ke mosaik Terrain Tiles. Terrain tetap berasal dari DEM nyata.",
      startAltitude: 1.8,
      maxClearance: 10,
      pitch: -0.24,
      yaw: 0.18,
      descriptor: "Terbang di antara dinding Grand Canyon dan lihat bagaimana sungai, erosi, serta perbedaan elevasi membentuk ngarai.",
      educational: ["Grand Canyon adalah ngarai besar yang dilalui Sungai Colorado.", "Rim adalah tepi dataran tinggi di bagian atas ngarai.", "Erosi perlahan mengikis dan memindahkan batuan hingga membentuk relief yang kita lihat sekarang."]
    },
    {
      id: "antarctica",
      name: "Antarktika / Vostok",
      short: "Antarktika",
      latitude: -78.4667,
      longitude: 106.8,
      zoom: 8,
      mode: "land",
      terrainStyle: "ice",
      feature: "Dataran Tinggi Antarktika",
      infoLabel: "DATARAN ES · ANTARKTIKA TIMUR",
      definition: "Dataran Tinggi Antarktika adalah wilayah pedalaman Antarktika yang tertutup lapisan es sangat tebal dan berada pada elevasi tinggi. Eksplorasi ini menampilkan bentuk permukaan esnya, bukan batuan dasar yang tersembunyi jauh di bawah es.",
      sourceLabel: "Terrarium surface elevation · global open elevation composite",
      sourceDetail: "Mode ini menampilkan elevasi permukaan yang tersedia pada mosaik global. Ini BUKAN visualisasi bedrock sub-ice dan tidak dipresentasikan sebagai topografi di bawah lapisan es.",
      startAltitude: 2.2,
      maxClearance: 12,
      pitch: -0.15,
      yaw: -0.12,
      descriptor: "Jelajahi pedalaman Antarktika Timur dan bedakan permukaan lapisan es dari batuan yang tersembunyi di bawahnya.",
      educational: ["Yang terlihat di mode ini adalah permukaan lapisan es.", "Wilayah pedalaman Antarktika dapat berada jauh dari garis pantai dan pada elevasi tinggi.", "Bentuk permukaan es dan bentuk batuan dasar di bawahnya tidak selalu sama."]
    }
  ]);


  const REGION_MEDIA = Object.freeze({
    everest: Object.freeze({
      src: "https://upload.wikimedia.org/wikipedia/commons/1/13/Everest%2C_South_Col%2C_Himalayas.jpg",
      alt: "Mount Everest dan Pegunungan Himalaya",
      caption: "Mount Everest · Himalaya · foto referensi Wikimedia Commons"
    }),
    mariana: Object.freeze({
      src: "https://omao.noaa.gov/sites/default/files/2025-12/survey%20area.png",
      alt: "Peta batimetri wilayah Palung Mariana",
      caption: "Palung Mariana · peta batimetri NOAA"
    }),
    maunakea: Object.freeze({
      src: "https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/s3fs-public/thumbnails/image/maunakea2.jpg",
      alt: "Mauna Kea di Hawaiʻi",
      caption: "Mauna Kea · Hawaiʻi · foto USGS"
    }),
    grandcanyon: Object.freeze({
      src: "https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/s3fs-public/thumbnails/image/YES.Scott_.002.GrandCanyon.051919.jpg",
      alt: "Grand Canyon dari South Rim dekat Powell Point",
      caption: "Grand Canyon · South Rim · foto USGS"
    }),
    antarctica: Object.freeze({
      src: "https://assets.science.nasa.gov/dynamicimage/assets/science/esd/eo/images/imagerecords/36000/36839/Antarctica_AMO_2009027_lrg.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1200&w=1600",
      alt: "Citra satelit Antarktika",
      caption: "Antarktika · mosaik MODIS · NASA Earth Observatory"
    })
  });

  const REGION_VISUALS = Object.freeze({
    everest: { skyTop: 0x5f89a9, skyHorizon: 0xd9e6ed, fog: 0xc7d8e2, fogDensity: 0.0027, hemiSky: 0xe7f5ff, hemiGround: 0x4a4540, sun: 0xfff4df, sunIntensity: 3.05, exposure: 1.15 },
    mariana: { skyTop: 0x061925, skyHorizon: 0x163c50, fog: 0x082d3d, fogDensity: 0.028, hemiSky: 0x5d91a8, hemiGround: 0x07131b, sun: 0x79b8cf, sunIntensity: 0.72, exposure: 0.92 },
    maunakea: { skyTop: 0x4c8cba, skyHorizon: 0xc5e4ed, fog: 0xa8c7d1, fogDensity: 0.0034, hemiSky: 0xe9f8ff, hemiGround: 0x3d352f, sun: 0xffe8c6, sunIntensity: 2.85, exposure: 1.10 },
    grandcanyon: { skyTop: 0x6495bd, skyHorizon: 0xe2c5a6, fog: 0xcdb7a1, fogDensity: 0.0030, hemiSky: 0xf3e7d6, hemiGround: 0x5b3627, sun: 0xffd9aa, sunIntensity: 3.20, exposure: 1.08 },
    antarctica: { skyTop: 0x7ca9c8, skyHorizon: 0xecf7fb, fog: 0xe0edf2, fogDensity: 0.0042, hemiSky: 0xf7fdff, hemiGround: 0x7c9cab, sun: 0xf5fbff, sunIntensity: 2.45, exposure: 1.20 }
  });

  const EARTH_EDUCATION = Object.freeze({
    everest: {
      intro: "Kenali dulu bagian penting Himalaya, lalu dekati setiap titik untuk melihat bagaimana gunung, punggungan, dan lereng saling terhubung.",
      observations: [
        { id:"everest-summit", title:"Puncak Everest", type:"TAHUKAH KAMU?", x:0, z:0, radius:5.5, lead:"Puncak Everest adalah titik tertinggi di Bumi jika diukur dari permukaan laut. Puncaknya berada di Pegunungan Himalaya, di perbatasan Nepal dan Tibet, Tiongkok.", why:"Everest membantu kita melihat seberapa ekstrem perbedaan ketinggian di Himalaya. Puncak, punggungan, dan lembah di sekitarnya membentuk satu sistem pegunungan besar.", sections:[["COBA PERHATIKAN","Lihat bagaimana medan naik tajam menuju bagian tinggi lalu turun lagi ke lembah. Bentuk besar ini mengikuti data elevasi wilayah Everest."],["KOK BISA SETINGGI INI?","Himalaya terus terangkat karena Lempeng India bergerak menekan Lempeng Eurasia. Prosesnya sangat lambat, tetapi berlangsung selama jutaan tahun."]] },
        { id:"everest-ridge", title:"Punggungan Himalaya", type:"LIHAT DEH!", x:6, z:-5, radius:4.5, lead:"Punggungan Himalaya adalah jalur medan tinggi yang menghubungkan satu bagian pegunungan dengan bagian lainnya. Jadi pegunungan bukan kumpulan puncak yang berdiri sendiri.", why:"Dengan mengikuti punggungan, kamu bisa melihat arah memanjang pegunungan dan bagaimana lereng turun ke lembah di kedua sisinya.", sections:[["IKUTI GARIS TINGGINYA","Gerakkan kamera sepanjang bagian yang tetap tinggi. Coba bandingkan bentuk lereng di sisi kiri dan kanan."],["BUKAN CUMA TEKSTUR","Salju dan batu membantu tampilannya terasa nyata, tetapi bentuk punggungan utamanya tetap mengikuti data elevasi."]] },
        { id:"everest-relief", title:"Relief dan Lereng", type:"COBA PERHATIKAN!", x:-6, z:5, radius:4.5, lead:"Relief adalah perbedaan tinggi dan rendah pada suatu bentang alam. Di Himalaya, perubahannya bisa sangat besar dalam jarak yang relatif dekat.", why:"Relief yang curam memengaruhi aliran es dan air, jalur pendakian, hingga pola cuaca lokal di sekitar pegunungan.", sections:[["BANDINGKAN TINGGINYA","Bergeraklah dari bagian rendah menuju punggungan dan lihat nilai terrain pada HUD berubah."],["BAYANGKAN SKALANYA","Jarak di mode ini menggunakan kilometer. Artinya, lereng dan lembah yang kamu lintasi mewakili bentang alam yang benar-benar luas."]] }
      ]
    },
    mariana: {
      intro: "Kenali bentuk Palung Mariana dari dasar lautnya, lalu amati Challenger Deep, sumbu palung, dan perubahan lingkungan saat bergerak makin dalam.",
      observations: [
        { id:"mariana-deep", title:"Challenger Deep", type:"TERNYATA...", x:0, z:0, radius:6, lead:"Challenger Deep adalah bagian terdalam yang diketahui di Palung Mariana. Lokasinya berada jauh di bawah permukaan Samudra Pasifik.", why:"Titik ini menunjukkan bahwa dasar samudra tidak rata. Ada pegunungan, dataran, dan palung yang perbedaan kedalamannya bisa sangat besar.", sections:[["LIHAT ANGKA KEDALAMAN","Nilai terrain negatif berarti titik tersebut berada di bawah muka laut. Semakin besar nilai kedalamannya, semakin jauh posisi dasar laut dari permukaan."],["BUKAN LUBANG ACAK","Challenger Deep berada di dalam sistem palung yang memanjang. Bentuk terrain di mode ini berasal dari data bathymetry, bukan lubang yang dibuat secara acak."]] },
        { id:"mariana-axis", title:"Sumbu Palung", type:"COBA PERHATIKAN!", x:7, z:-4, radius:5, lead:"Sumbu palung adalah jalur bagian terdalam yang memanjang mengikuti bentuk utama sebuah palung laut. Jadi Palung Mariana bukan sekadar satu lubang bulat di dasar samudra.", why:"Bentuk memanjang ini berkaitan dengan batas lempeng tektonik. Di wilayah Mariana, salah satu lempeng bergerak masuk ke bawah lempeng lainnya melalui proses yang disebut subduksi.", sections:[["IKUTI ARAHNYA","Terbang mengikuti bagian dasar yang lebih rendah. Kamu akan melihat lembah lautnya terus memanjang."],["APA ITU SUBDUKSI?","Subduksi terjadi ketika satu lempeng tektonik menunjam ke bawah lempeng lain. Proses ini dapat membentuk palung laut yang sangat dalam."]] },
        { id:"mariana-water", title:"Kolom Air Laut Dalam", type:"TAHUKAH KAMU?", x:-6, z:5, radius:5, lead:"Kolom air adalah seluruh lapisan air dari permukaan laut sampai ke dasar samudra. Di Palung Mariana, jarak vertikal ini luar biasa besar.", why:"Semakin dalam kita turun, cahaya Matahari semakin sulit menembus air. Lingkungan laut dalam pun menjadi gelap, dingin, dan memiliki tekanan sangat tinggi.", sections:[["COBA LIHAT SUASANANYA","Saat kamera turun, lingkungan dibuat semakin gelap dan kebiruan untuk membantu memberi rasa kedalaman."],["INGAT YA","Kabut dan partikel air hanyalah bantuan visual. Bentuk dasar lautnya tetap mengikuti data bathymetry."]] }
      ]
    },
    maunakea: {
      intro: "Kenali Mauna Kea sebagai satu gunung besar dari dasar samudra hingga puncaknya, lalu amati puncak, lereng vulkanik, dan hubungan gunung dengan muka laut.",
      observations: [
        { id:"mauna-summit", title:"Puncak Mauna Kea", type:"TAHUKAH KAMU?", x:0, z:0, radius:5.5, lead:"Mauna Kea adalah gunung api perisai besar di Pulau Hawaiʻi. Puncaknya berada lebih dari 4 kilometer di atas permukaan laut, tetapi tubuh gunungnya masih berlanjut jauh ke bawah laut.", why:"Kalau hanya melihat bagian yang muncul di atas air, ukuran Mauna Kea mudah terasa lebih kecil daripada sebenarnya. Gunung ini tumbuh dari dasar samudra.", sections:[["LIHAT LERENGNYA","Perhatikan bagaimana lereng menyebar jauh dari pusat puncak. Bentuk yang lebar ini khas gunung api perisai."],["SATU GUNUNG BESAR","Bagian pulau yang terlihat dan bagian gunung di bawah laut tetap merupakan bagian dari sistem vulkanik yang sama."]] },
        { id:"mauna-slope", title:"Lereng Vulkanik", type:"LIHAT DEH!", x:7, z:4, radius:5, lead:"Lereng vulkanik adalah sisi gunung yang terbentuk dari tumpukan material hasil aktivitas gunung api. Pada gunung api perisai seperti Mauna Kea, lerengnya cenderung luas dan tidak setajam banyak gunung berbentuk kerucut.", why:"Lava yang relatif cair dapat mengalir lebih jauh sebelum membeku. Dari waktu ke waktu, aliran itu membantu membangun tubuh gunung yang lebar.", sections:[["BANDINGKAN BENTUKNYA","Coba bandingkan kemiringan Mauna Kea dengan relief tajam di Himalaya. Keduanya sama-sama tinggi, tetapi bentuk bentang alamnya berbeda."],["TEKSTUR VS BENTUK","Detail batu membantu permukaan terlihat lebih hidup, sedangkan bentuk lereng besarnya mengikuti data elevasi."]] },
        { id:"mauna-sea", title:"Gunung dan Muka Laut", type:"COBA PERHATIKAN!", x:-7, z:-5, radius:5, lead:"Muka laut adalah acuan ketinggian nol yang memisahkan bagian daratan dari bagian yang berada di bawah air. Pada Mauna Kea, acuan ini memotong tubuh gunung yang sebenarnya jauh lebih besar.", why:"Dengan melihat daratan dan dasar laut dalam satu model, kita bisa memahami bahwa garis pantai bukanlah tempat gunung itu berakhir.", sections:[["CARI GARIS NOL","Permukaan air menjadi petunjuk sederhana untuk melihat bagian gunung yang berada di atas dan di bawah muka laut."],["COBA BAYANGKAN","Kalau air samudra dihilangkan, lereng Mauna Kea akan terlihat terus turun menuju dasar laut."]] }
      ]
    },
    grandcanyon: {
      intro: "Kenali Grand Canyon dari koridor ngarai, bagian rim, dan jejak erosi. Dekati tiap titik untuk melihat bagaimana perbedaan elevasi membentuk bentang alamnya.",
      observations: [
        { id:"canyon-core", title:"Koridor Grand Canyon", type:"LIHAT DEH!", x:0, z:0, radius:5.5, lead:"Grand Canyon adalah ngarai besar di Arizona yang membelah dataran tinggi. Sungai Colorado mengalir melalui bagian dasarnya dan menjadi salah satu pelaku utama pengikisan ngarai.", why:"Koridor ngarai memperlihatkan perbedaan tinggi antara dataran di atas dan lembah di bawah. Dari sinilah skala Grand Canyon mulai terasa.", sections:[["IKUTI BAGIAN RENDAH","Terbang mengikuti jalur yang lebih rendah dan lihat dinding ngarai berdiri di kedua sisinya."],["LAPISAN BATU","Perbedaan warna membantu memperjelas lapisan batuan, tetapi bentuk utama ngarai tetap mengikuti data elevasi."]] },
        { id:"canyon-rim", title:"Tepi Ngarai", type:"COBA PERHATIKAN!", x:6, z:-5, radius:4.5, lead:"Rim adalah tepi bagian atas Grand Canyon, tempat dataran tinggi tiba-tiba berubah menjadi lereng dan dinding yang turun ke dalam ngarai.", why:"Berdiri di dekat rim membuat perbedaan ketinggian jauh lebih mudah dibaca karena bagian atas dan dasar ngarai bisa dibandingkan secara langsung.", sections:[["BANDINGKAN ELEVASI","Bergeraklah dari rim menuju bagian yang lebih rendah lalu lihat nilai Terrain Lokal pada HUD."],["KENAPA TERLIHAT CURAM?","Perubahan ketinggian dalam jarak pendek membuat dinding ngarai tampak sangat terjal."]] },
        { id:"canyon-erosion", title:"Jejak Erosi", type:"KENAPA BISA BEGINI?", x:-6, z:5, radius:4.5, lead:"Erosi adalah proses pengikisan dan pemindahan batuan oleh air, angin, es, atau gaya alam lainnya. Di Grand Canyon, proses ini bekerja bersama pengangkatan wilayah selama waktu yang sangat panjang.", why:"Grand Canyon tidak terbentuk dalam satu kejadian. Bentuknya merupakan hasil perubahan sedikit demi sedikit yang terus berlangsung dalam skala waktu geologi.", sections:[["AIR DAN WAKTU","Sungai dan aliran air mengikis batuan, sementara material yang terlepas dibawa menjauh dari tempat asalnya."],["BACA CABANG LEMBAH","Lembah kecil yang bergabung ke koridor utama memberi petunjuk tentang jalur air dan arah pengikisan medan."]] }
      ]
    },
    antarctica: {
      intro: "Kenali pedalaman Antarktika Timur lewat dataran tinggi es, bentuk permukaan lapisan es, dan konteks wilayah Vostok. Ingat, yang terlihat adalah permukaan es, bukan batuan di bawahnya.",
      observations: [
        { id:"antarctica-plateau", title:"Dataran Tinggi Es", type:"TAHUKAH KAMU?", x:0, z:0, radius:6, lead:"Dataran Tinggi Antarktika adalah wilayah luas di pedalaman benua yang tertutup lapisan es dan berada pada elevasi tinggi. Permukaannya terlihat lebih halus dibanding pegunungan berbatu.", why:"Lapisan es Antarktika sangat tebal, sehingga bentuk permukaan yang kita lihat tidak sama dengan bentuk batuan dasar yang tersembunyi jauh di bawahnya.", sections:[["APA YANG KAMU LIHAT?","Mode ini menampilkan elevasi permukaan es. Jadi tonjolan dan cekungan yang tampak adalah bentuk bagian atas lapisan es."],["JANGAN TERTUKAR","Bedrock adalah batuan dasar di bawah es. Untuk melihatnya dengan benar dibutuhkan data khusus yang berbeda dari surface elevation."]] },
        { id:"antarctica-ice", title:"Permukaan Lapisan Es", type:"COBA PERHATIKAN!", x:7, z:-5, radius:5, lead:"Permukaan lapisan es adalah bagian paling atas dari es Antarktika yang bersentuhan langsung dengan atmosfer. Walaupun dari jauh terlihat rata, permukaannya tetap memiliki perubahan ketinggian.", why:"Perubahan reliefnya sering lebih halus daripada pegunungan berbatu. Karena itu cahaya, bayangan, dan warna membantu mata membaca bentuk permukaan es.", sections:[["LIHAT BAYANGANNYA","Perhatikan perubahan shading saat melewati lereng yang sangat landai. Perubahan kecil itu membantu memperlihatkan kontur medan."],["BENTUKNYA TETAP DARI DATA","Material putih dan biru hanya membantu keterbacaan. Ia tidak menambahkan gunung atau cekungan baru ke terrain."]] },
        { id:"antarctica-vostok", title:"Wilayah Vostok", type:"TERNYATA...", x:-7, z:5, radius:5, lead:"Vostok adalah kawasan pedalaman Antarktika Timur yang terkenal karena Stasiun Vostok, sebuah stasiun penelitian Rusia. Wilayahnya jauh dari pantai dan berada di atas lapisan es benua yang sangat luas.", why:"Antarktika bukan hanya tebing es di tepi laut. Sebagian besar interiornya adalah hamparan es luas dengan kondisi yang sangat dingin dan elevasi tinggi.", sections:[["LIHAT HORIZONNYA","Bandingkan horizon panjang di sini dengan relief tajam Himalaya atau Grand Canyon. Bentuk bentang alamnya jauh lebih lembut."],["SUASANA VS DATA","Efek dingin dan pencahayaan membantu suasana eksplorasi, tetapi tidak mengubah nilai elevasi yang digunakan terrain."]] }
      ]
    }
  });

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = value => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
  const wrapLongitude = lon => { let v = lon; while (v < -180) v += 360; while (v >= 180) v -= 360; return v; };
  const formatLatLon = (lat, lon) => `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"} · ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "W"}`;
  const formatKm = km => Math.abs(km) < 1 ? `${Math.round(km * 1000)} M` : `${km.toFixed(Math.abs(km) < 10 ? 2 : 1)} KM`;
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  class TerrariumProvider {
    constructor() {
      this.cache = new Map();
      this.pending = new Map();
      this.generation = 0;
      this.maxCache = 42;
    }

    address(latitude, longitude, zoom) {
      const n = 2 ** zoom;
      const lat = clamp(latitude, -85.05112878, 85.05112878);
      const xFloat = (wrapLongitude(longitude) + 180) / 360 * n;
      const latRad = lat * DEG;
      const yFloat = (1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n;
      return { xFloat, yFloat, x: ((Math.floor(xFloat) % n) + n) % n, y: clamp(Math.floor(yFloat), 0, n - 1), zoom };
    }

    longitudeForX(x, zoom) {
      return x / (2 ** zoom) * 360 - 180;
    }

    latitudeForY(y, zoom) {
      const n = Math.PI - 2 * Math.PI * y / (2 ** zoom);
      return 180 / Math.PI * Math.atan(Math.sinh(n));
    }

    key(z, x, y) { return `${z}/${x}/${y}`; }
    url(z, x, y) { return TERRARIUM_TEMPLATE.replace("{z}", z).replace("{x}", x).replace("{y}", y); }

    async load(z, x, y) {
      const n = 2 ** z;
      const safeX = ((x % n) + n) % n;
      const safeY = clamp(y, 0, n - 1);
      const key = this.key(z, safeX, safeY);
      if (this.cache.has(key)) {
        const tile = this.cache.get(key);
        tile.lastUsed = performance.now();
        return tile;
      }
      if (this.pending.has(key)) return this.pending.get(key);
      const generation = this.generation;
      const promise = new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.decoding = "async";
        const src = this.url(z, safeX, safeY);
        let settled = false;
        const timer = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          image.src = "";
          reject(new Error(`Timeout saat memuat DEM: ${src}`));
        }, 16000);
        image.onload = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (generation !== this.generation) return reject(new Error("Permintaan DEM dibatalkan."));
          try {
            const canvas = document.createElement("canvas");
            canvas.width = 256;
            canvas.height = 256;
            const context = canvas.getContext("2d", { willReadFrequently: true });
            context.drawImage(image, 0, 0, 256, 256);
            const rgba = context.getImageData(0, 0, 256, 256).data;
            const heights = new Float32Array(256 * 256);
            let min = Infinity, max = -Infinity;
            for (let i = 0, p = 0; p < heights.length; p += 1, i += 4) {
              const meters = rgba[i] * 256 + rgba[i + 1] + rgba[i + 2] / 256 - 32768;
              heights[p] = meters / 1000;
              min = Math.min(min, heights[p]);
              max = Math.max(max, heights[p]);
            }
            const tile = { z, x: safeX, y: safeY, heights, min, max, lastUsed: performance.now(), src };
            this.cache.set(key, tile);
            this.trim();
            resolve(tile);
          } catch (error) {
            reject(new Error(`DEM Terrarium tidak dapat dibaca: ${error.message}`));
          }
        };
        image.onerror = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(new Error(`Tile elevasi real tidak tersedia: ${src}`));
        };
        image.src = src;
      }).finally(() => this.pending.delete(key));
      this.pending.set(key, promise);
      return promise;
    }

    trim() {
      if (this.cache.size <= this.maxCache) return;
      const sorted = [...this.cache.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed);
      while (this.cache.size > this.maxCache && sorted.length) this.cache.delete(sorted.shift()[0]);
    }

    sampleTile(tile, u, v) {
      const x = clamp(u, 0, 0.999999) * 255;
      const y = clamp(v, 0, 0.999999) * 255;
      const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(255, x0 + 1), y1 = Math.min(255, y0 + 1);
      const tx = x - x0, ty = y - y0;
      const h00 = tile.heights[y0 * 256 + x0], h10 = tile.heights[y0 * 256 + x1];
      const h01 = tile.heights[y1 * 256 + x0], h11 = tile.heights[y1 * 256 + x1];
      return lerp(lerp(h00, h10, tx), lerp(h01, h11, tx), ty);
    }

    sampleCached(latitude, longitude, zoom) {
      const a = this.address(latitude, longitude, zoom);
      const tile = this.cache.get(this.key(zoom, a.x, a.y));
      if (!tile) return null;
      tile.lastUsed = performance.now();
      return this.sampleTile(tile, a.xFloat - Math.floor(a.xFloat), a.yFloat - Math.floor(a.yFloat));
    }

    clear() {
      this.generation += 1;
      this.pending.clear();
      this.cache.clear();
    }
  }

  class EarthTerrainManager {
    constructor(THREE, scene, renderer, provider, region, quality) {
      this.THREE = THREE;
      this.scene = scene;
      this.renderer = renderer;
      this.provider = provider;
      this.region = region;
      this.quality = quality;
      this.entries = new Map();
      this.frustum = new THREE.Frustum();
      this.projection = new THREE.Matrix4();
      this.forward = new THREE.Vector3();
      this.toChunk = new THREE.Vector3();
      this.bounds = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
      this.playBounds = null;
      this.centerAddress = provider.address(region.latitude, region.longitude, region.zoom);
      this.centerXFloat = this.centerAddress.xFloat;
      this.centerYFloat = this.centerAddress.yFloat;
      this.material = this.createMaterial();
      this.water = null;
      this.sky = null;
      this.particles = null;
      this.observationGroup = null;
      this.observationMarkers = new Map();
      this.observationMarkerResources = [];
      this.observationTime = 0;
      this.environmentTime = 0;
    }

    createSurfaceTexture(kind = "detail") {
      const T = this.THREE;
      const size = this.quality.name === "LOW" ? 128 : 256;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      const image = ctx.createImageData(size, size);
      const seed = this.region.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      const style = this.region.terrainStyle;
      const palette = {
        alpine: [232, 235, 233], abyss: [196, 210, 215], volcanic: [216, 210, 202], canyon: [229, 205, 188], ice: [238, 248, 252]
      }[style] || [225, 225, 220];
      for (let y = 0; y < size; y += 1) {
        const py = y / size * Math.PI * 2;
        for (let x = 0; x < size; x += 1) {
          const px = x / size * Math.PI * 2;
          const p = (y * size + x) * 4;
          const broad = Math.sin(px * 3 + seed * 0.013) * Math.cos(py * 4 - seed * 0.017);
          const mid = Math.sin(px * 11 + py * 7 + seed * 0.021) * 0.55 + Math.cos(px * 8 - py * 13) * 0.45;
          const fine = Math.sin(px * 31 + py * 23 + seed) * Math.cos(px * 19 - py * 29 - seed) * 0.5;
          const n = clamp(broad * 0.34 + mid * 0.42 + fine * 0.24, -1, 1);
          let r, g, b;
          if (kind === "bump") {
            const v = Math.round(clamp(128 + n * 76, 22, 234));
            r = g = b = v;
          } else if (kind === "roughness") {
            const base = style === "ice" ? 178 : style === "abyss" ? 220 : style === "volcanic" ? 236 : 224;
            const v = Math.round(clamp(base + n * 23, 120, 252));
            r = g = b = v;
          } else {
            const strength = style === "canyon" ? 0.14 : style === "volcanic" ? 0.12 : 0.09;
            const factor = 1 + n * strength;
            r = Math.round(clamp(palette[0] * factor, 160, 255));
            g = Math.round(clamp(palette[1] * factor, 160, 255));
            b = Math.round(clamp(palette[2] * factor, 160, 255));
          }
          image.data[p] = r; image.data[p + 1] = g; image.data[p + 2] = b; image.data[p + 3] = 255;
        }
      }
      ctx.putImageData(image, 0, 0);
      const texture = new T.CanvasTexture(canvas);
      texture.wrapS = texture.wrapT = T.RepeatWrapping;
      texture.colorSpace = kind === "detail" ? T.SRGBColorSpace : T.NoColorSpace;
      texture.anisotropy = Math.min(this.quality.anisotropy, this.renderer.capabilities.getMaxAnisotropy());
      texture.needsUpdate = true;
      return texture;
    }

    configureTerrainMaterial(material, textures) {
      const style = this.region.terrainStyle;
      const detailScale = style === "ice" ? 0.70 : style === "abyss" ? 0.45 : style === "canyon" ? 0.82 : 0.95;
      const fineScale = style === "canyon" ? 3.4 : style === "ice" ? 2.0 : 2.8;
      const microStrength = this.quality.name === "HIGH" ? 0.22 : this.quality.name === "MEDIUM" ? 0.17 : 0.11;
      material.bumpMap = textures.bump;
      material.bumpScale = 0.001;
      material.onBeforeCompile = shader => {
        shader.uniforms.uEarthDetail = { value: textures.detail };
        shader.uniforms.uEarthBump = { value: textures.bump };
        shader.uniforms.uEarthRough = { value: textures.roughness };
        shader.uniforms.uEarthDetailScale = { value: detailScale };
        shader.uniforms.uEarthFineScale = { value: fineScale };
        shader.uniforms.uEarthMicroStrength = { value: microStrength };
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vEarthWorldPosition;")
          .replace("#include <begin_vertex>", "#include <begin_vertex>\nvEarthWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;");
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", `#include <common>
            varying vec3 vEarthWorldPosition;
            uniform sampler2D uEarthDetail;
            uniform sampler2D uEarthBump;
            uniform sampler2D uEarthRough;
            uniform float uEarthDetailScale;
            uniform float uEarthFineScale;
            uniform float uEarthMicroStrength;
            float earthTriSample(sampler2D tex, vec3 p, vec3 n, float scale, vec3 phase) {
              vec3 blend = pow(max(abs(n), vec3(0.0001)), vec3(5.0));
              blend /= max(blend.x + blend.y + blend.z, 0.0001);
              float sx = texture2D(tex, p.yz * scale + phase.yz).r;
              float sy = texture2D(tex, p.xz * scale + phase.xz).r;
              float sz = texture2D(tex, p.xy * scale + phase.xy).r;
              return sx * blend.x + sy * blend.y + sz * blend.z;
            }`)
          .replace("#include <map_fragment>", `#include <map_fragment>
            vec3 earthDx = dFdx(vEarthWorldPosition);
            vec3 earthDy = dFdy(vEarthWorldPosition);
            vec3 earthGeomNormal = normalize(cross(earthDx, earthDy));
            if (!gl_FrontFacing) earthGeomNormal = -earthGeomNormal;
            float earthViewDistance = length(cameraPosition - vEarthWorldPosition);
            float earthNear = 1.0 - smoothstep(8.0, 48.0, earthViewDistance);
            float earthBroad = earthTriSample(uEarthDetail, vEarthWorldPosition, earthGeomNormal, uEarthDetailScale, vec3(0.17,0.43,0.71));
            float earthFine = earthTriSample(uEarthDetail, vEarthWorldPosition, earthGeomNormal, uEarthFineScale, vec3(0.63,0.11,0.29));
            float earthMicro = (earthBroad - 0.5) * 0.68 + (earthFine - 0.5) * 0.32 * earthNear;
            diffuseColor.rgb *= clamp(1.0 + earthMicro * uEarthMicroStrength, 0.84, 1.16);`)
          .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
            #ifdef USE_BUMPMAP
              float earthBumpBroad = earthTriSample(uEarthBump, vEarthWorldPosition, earthGeomNormal, uEarthDetailScale * 1.25, vec3(0.31,0.59,0.07));
              float earthBumpFine = earthTriSample(uEarthBump, vEarthWorldPosition, earthGeomNormal, uEarthFineScale * 1.35, vec3(0.79,0.23,0.47));
              float earthMicroHeight = (earthBumpBroad - 0.5) * 0.55 + (earthBumpFine - 0.5) * 0.45 * earthNear;
              vec2 earthMicroSlope = vec2(dFdx(earthMicroHeight), dFdy(earthMicroHeight));
              normal = perturbNormalArb(-vViewPosition, normal, earthMicroSlope * (4.2 + 2.4 * earthNear), faceDirection);
            #endif`)
          .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
            float earthRoughSample = earthTriSample(uEarthRough, vEarthWorldPosition, earthGeomNormal, uEarthDetailScale * 0.9, vec3(0.41,0.19,0.83));
            roughnessFactor = clamp(roughnessFactor + (earthRoughSample - 0.5) * 0.18, 0.55, 0.99);`);
        material.userData.earthShader = shader;
      };
      material.customProgramCacheKey = () => `antara-earth-region-material-v3-${this.region.id}-${this.quality.name}`;
      material.needsUpdate = true;
      return material;
    }

    createMaterial() {
      const T = this.THREE;
      const textures = {
        detail: this.createSurfaceTexture("detail"),
        bump: this.createSurfaceTexture("bump"),
        roughness: this.createSurfaceTexture("roughness")
      };
      const baseRoughness = { alpine: 0.84, abyss: 0.93, volcanic: 0.91, canyon: 0.88, ice: 0.68 }[this.region.terrainStyle] ?? 0.88;
      const material = new T.MeshStandardMaterial({
        color: 0xffffff,
        roughness: baseRoughness,
        metalness: 0,
        vertexColors: true,
        side: T.FrontSide
      });
      material.userData.surfaceTextures = textures;
      return this.configureTerrainMaterial(material, textures);
    }

    colorForElevation(heightKm, slope = 0, x = 0, z = 0) {
      const T = this.THREE;
      const mix = (a, b, t) => new T.Color(a).lerp(new T.Color(b), clamp(t, 0, 1));
      const variation = Math.sin(x * 0.19 + z * 0.13) * 0.5 + Math.cos(x * 0.07 - z * 0.17) * 0.5;
      if (this.region.terrainStyle === "alpine") {
        const low = mix(0x566052, 0x726f63, smoothstep((heightKm - 2.8) / 1.8));
        const rock = mix(0x77746d, 0xa7a7a2, smoothstep((heightKm - 4.1) / 1.6));
        let base = low.lerp(rock, smoothstep((heightKm - 3.7) / 1.4));
        const snow = clamp(smoothstep((heightKm - 4.65) / 1.35) * (1 - slope * 0.48) + smoothstep((heightKm - 6.5) / 0.8) * 0.42, 0, 1);
        base.lerp(new T.Color(0xf3f7f8), snow);
        if (slope > 0.58) base.lerp(new T.Color(0x676765), (slope - 0.58) * 0.48);
        return base.multiplyScalar(0.96 + variation * 0.035);
      }
      if (this.region.terrainStyle === "volcanic") {
        if (heightKm < -0.05) {
          const depth = clamp((-heightKm) / 5.2, 0, 1);
          return mix(0x2a6976, 0x123448, depth);
        }
        if (heightKm < 0.16) return mix(0x6b7056, 0x76664f, heightKm / 0.16);
        if (heightKm < 1.6) return mix(0x39533f, 0x514b3e, heightKm / 1.6);
        if (heightKm < 3.0) return mix(0x4b443d, 0x67584d, (heightKm - 1.6) / 1.4);
        return mix(0x655a52, 0x83786e, smoothstep((heightKm - 3.0) / 1.2));
      }
      if (this.region.terrainStyle === "canyon") {
        const normalized = clamp((heightKm - 0.4) / 2.6, 0, 1);
        const stripe = 0.5 + 0.5 * Math.sin(heightKm * 21 + variation * 2.4);
        let base = mix(0x6f392d, 0xc37a4e, normalized);
        base.lerp(new T.Color(stripe > 0.52 ? 0xd39768 : 0x7f4736), 0.18 + stripe * 0.11);
        if (slope > 0.52) base.lerp(new T.Color(0x63352b), (slope - 0.52) * 0.55);
        return base.multiplyScalar(0.97 + variation * 0.03);
      }
      if (this.region.terrainStyle === "ice") {
        let base = mix(0xb9d9e7, 0xf7fcff, smoothstep((heightKm - 0.8) / 2.8));
        base.lerp(new T.Color(0x9fc7da), clamp(slope * 0.34, 0, 0.34));
        const windScour = smoothstep((variation + 1) * 0.5) * 0.12;
        base.lerp(new T.Color(0xe0f2f8), windScour);
        return base;
      }
      const depth = clamp((-heightKm - 2.0) / 9.0, 0, 1);
      let base = mix(0x435e67, 0x172d3a, depth);
      const sediment = clamp((variation + 1) * 0.5, 0, 1);
      base.lerp(new T.Color(0x52615d), sediment * 0.12 * (1 - depth));
      if (slope > 0.55) base.lerp(new T.Color(0x293c43), (slope - 0.55) * 0.28);
      return base;
    }

    tileCenterWorld(tile) {
      const lonW = this.provider.longitudeForX(tile.x, tile.z);
      const lonE = this.provider.longitudeForX(tile.x + 1, tile.z);
      const latN = this.provider.latitudeForY(tile.y, tile.z);
      const latS = this.provider.latitudeForY(tile.y + 1, tile.z);
      const lon = wrapLongitude((lonW + lonE) * 0.5);
      const lat = (latN + latS) * 0.5;
      const cos = Math.max(0.08, Math.cos(this.region.latitude * DEG));
      return {
        x: wrapLongitude(lon - this.region.longitude) * KM_PER_DEG_LAT * cos,
        z: -(lat - this.region.latitude) * KM_PER_DEG_LAT
      };
    }

    geometryFor(entry, segments) {
      if (entry.geometries.has(segments)) return entry.geometries.get(segments);
      const T = this.THREE;
      const geometry = new T.PlaneGeometry(1, 1, segments, segments);
      const position = geometry.attributes.position;
      const colors = new Float32Array(position.count * 3);
      const count = segments + 1;
      const heights = new Float32Array(count * count);
      const xs = new Float32Array(count * count);
      const zs = new Float32Array(count * count);
      const cos = Math.max(0.08, Math.cos(this.region.latitude * DEG));
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

      for (let row = 0; row <= segments; row += 1) {
        const v = row / segments;
        const tileY = entry.tile.y + v;
        const lat = this.provider.latitudeForY(tileY, entry.tile.z);
        for (let col = 0; col <= segments; col += 1) {
          const u = col / segments;
          const index = row * count + col;
          const lon = this.provider.longitudeForX(entry.tile.x + u, entry.tile.z);
          const height = this.provider.sampleTile(entry.tile, u, v);
          const x = wrapLongitude(lon - this.region.longitude) * KM_PER_DEG_LAT * cos;
          const z = -(lat - this.region.latitude) * KM_PER_DEG_LAT;
          heights[index] = height; xs[index] = x; zs[index] = z;
          position.setXYZ(index, x, height, z);
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
        }
      }

      const sampleHeight = (row, col) => heights[clamp(row, 0, segments) * count + clamp(col, 0, segments)];
      for (let row = 0; row <= segments; row += 1) {
        for (let col = 0; col <= segments; col += 1) {
          const index = row * count + col;
          const left = sampleHeight(row, col - 1), right = sampleHeight(row, col + 1);
          const up = sampleHeight(row - 1, col), down = sampleHeight(row + 1, col);
          const dx = Math.max(0.03, Math.abs(xs[row * count + Math.min(segments, col + 1)] - xs[row * count + Math.max(0, col - 1)]));
          const dz = Math.max(0.03, Math.abs(zs[Math.min(segments, row + 1) * count + col] - zs[Math.max(0, row - 1) * count + col]));
          const gx = (right - left) / dx;
          const gz = (down - up) / dz;
          const slope = clamp(Math.hypot(gx, gz) * 2.15, 0, 1);
          const c = this.colorForElevation(heights[index], slope, xs[index], zs[index]);
          colors[index * 3] = c.r;
          colors[index * 3 + 1] = c.g;
          colors[index * 3 + 2] = c.b;
        }
      }

      geometry.setAttribute("color", new T.BufferAttribute(colors, 3));
      position.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
      geometry.userData.bounds = { minX, maxX, minZ, maxZ };
      entry.geometries.set(segments, geometry);
      if (entry.geometries.size > 3) {
        const first = entry.geometries.keys().next().value;
        if (first !== segments) { entry.geometries.get(first)?.dispose(); entry.geometries.delete(first); }
      }
      return geometry;
    }

    segmentSet() {
      if (this.quality.name === "HIGH") return { high: 144, medium: 72, low: 30 };
      if (this.quality.name === "MEDIUM") return { high: 96, medium: 52, low: 24 };
      return { high: 56, medium: 32, low: 18 };
    }

    desiredSegments(entry, camera) {
      const set = this.segmentSet();
      const center = entry.center;
      const dx = camera.position.x - center.x;
      const dz = camera.position.z - center.z;
      const distance = Math.hypot(dx, dz);
      const clearance = Math.max(0.1, camera.position.y - (this.heightAtWorld(camera.position.x, camera.position.z) ?? 0));
      if (this.quality.name === "LOW") return distance < 18 && clearance < 5 ? set.high : set.low;
      if (distance < 18 && clearance < 5) return set.high;
      if (distance < 45 && clearance < 12) return set.medium;
      return set.low;
    }

    async loadEntry(z, x, y, ring) {
      const tile = await this.provider.load(z, x, y);
      const key = this.provider.key(z, tile.x, tile.y);
      if (this.entries.has(key)) return this.entries.get(key);
      const entry = { key, tile, ring, geometries: new Map(), center: this.tileCenterWorld(tile), mesh: null, currentSegments: 0 };
      const set = this.segmentSet();
      const segments = ring === 0 ? set.high : ring === 1 ? set.medium : set.low;
      const geometry = this.geometryFor(entry, segments);
      const mesh = new this.THREE.Mesh(geometry, this.material);
      mesh.frustumCulled = true;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      entry.mesh = mesh;
      entry.currentSegments = segments;
      this.scene.add(mesh);
      const b = geometry.userData.bounds;
      this.bounds.minX = Math.min(this.bounds.minX, b.minX); this.bounds.maxX = Math.max(this.bounds.maxX, b.maxX);
      this.bounds.minZ = Math.min(this.bounds.minZ, b.minZ); this.bounds.maxZ = Math.max(this.bounds.maxZ, b.maxZ);
      this.entries.set(key, entry);
      return entry;
    }

    coordsForRadius(radius) {
      const c = this.centerAddress;
      const coords = [];
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          coords.push({ x: c.x + dx, y: c.y + dy, ring: Math.max(Math.abs(dx), Math.abs(dy)) });
        }
      }
      coords.sort((a, b) => a.ring - b.ring);
      return coords;
    }

    async loadCore(onProgress) {
      const coords = this.coordsForRadius(1);
      for (let i = 0; i < coords.length; i += 1) {
        const c = coords[i];
        await this.loadEntry(this.region.zoom, c.x, c.y, c.ring);
        onProgress?.((i + 1) / coords.length);
      }
      this.playBounds = { ...this.bounds };
      this.ensureWater();
      this.ensureEnvironment();
    }

    async loadExtended() {
      if (this.quality.radius < 2) return;
      const coords = this.coordsForRadius(2).filter(c => c.ring === 2);
      for (const c of coords) {
        try { await this.loadEntry(this.region.zoom, c.x, c.y, 2); }
        catch { /* Core terrain already guarantees a complete visible area. */ }
      }
      this.resizeWater();
    }

    createWaterTexture() {
      const T = this.THREE;
      const size = 192;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      const image = ctx.createImageData(size, size);
      for (let y = 0; y < size; y += 1) {
        const py = y / size * Math.PI * 2;
        for (let x = 0; x < size; x += 1) {
          const px = x / size * Math.PI * 2;
          const p = (y * size + x) * 4;
          const wave = Math.sin(px * 6 + py * 2) * 0.46 + Math.sin(px * 11 - py * 7) * 0.29 + Math.cos(px * 3 + py * 13) * 0.25;
          const v = Math.round(clamp(128 + wave * 54, 55, 205));
          image.data[p] = image.data[p + 1] = image.data[p + 2] = v;
          image.data[p + 3] = 255;
        }
      }
      ctx.putImageData(image, 0, 0);
      const texture = new T.CanvasTexture(canvas);
      texture.wrapS = texture.wrapT = T.RepeatWrapping;
      texture.repeat.set(this.region.mode === "underwater" ? 11 : 18, this.region.mode === "underwater" ? 11 : 18);
      texture.colorSpace = T.NoColorSpace;
      texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      return texture;
    }

    ensureWater() {
      if (!["underwater", "coastal"].includes(this.region.mode)) return;
      const T = this.THREE;
      const width = Math.max(120, this.bounds.maxX - this.bounds.minX + 20);
      const depth = Math.max(120, this.bounds.maxZ - this.bounds.minZ + 20);
      const geometry = new T.PlaneGeometry(width, depth, 48, 48);
      geometry.rotateX(-Math.PI / 2);
      const waves = this.createWaterTexture();
      const material = new T.MeshPhysicalMaterial({
        color: this.region.mode === "underwater" ? 0x0a506e : 0x197f9c,
        transparent: true,
        opacity: this.region.mode === "underwater" ? 0.50 : 0.66,
        roughness: this.region.mode === "underwater" ? 0.24 : 0.16,
        metalness: 0,
        transmission: this.region.mode === "underwater" ? 0.08 : 0.16,
        clearcoat: this.region.mode === "underwater" ? 0.18 : 0.46,
        clearcoatRoughness: 0.22,
        bumpMap: waves,
        bumpScale: this.region.mode === "underwater" ? 0.055 : 0.035,
        depthWrite: false,
        side: T.DoubleSide
      });
      material.userData.waveTexture = waves;
      this.water = new T.Mesh(geometry, material);
      this.water.position.y = 0;
      this.water.renderOrder = 3;
      this.scene.add(this.water);
    }

    ensureEnvironment() {
      const T = this.THREE;
      const visual = REGION_VISUALS[this.region.id] || REGION_VISUALS.maunakea;
      const geometry = new T.SphereGeometry(430, 32, 18);
      const material = new T.ShaderMaterial({
        side: T.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: new T.Color(visual.skyTop) },
          uHorizon: { value: new T.Color(visual.skyHorizon) },
          uUnderwater: { value: this.region.mode === "underwater" ? 1 : 0 }
        },
        vertexShader: `varying vec3 vSkyPos; void main(){ vSkyPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vSkyPos; uniform vec3 uTop; uniform vec3 uHorizon; uniform float uUnderwater; void main(){ float h=clamp(normalize(vSkyPos).y*0.5+0.5,0.0,1.0); h=smoothstep(0.12,0.92,h); vec3 col=mix(uHorizon,uTop,h); if(uUnderwater>0.5){ col*=mix(0.48,0.82,h); } gl_FragColor=vec4(col,1.0); }`
      });
      this.sky = new T.Mesh(geometry, material);
      this.sky.renderOrder = -20;
      this.scene.add(this.sky);

      if (this.region.mode === "underwater") {
        const count = this.quality.name === "LOW" ? 260 : 520;
        const positions = new Float32Array(count * 3);
        let state = 1847;
        const rand = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
        for (let i = 0; i < count; i += 1) {
          positions[i * 3] = (rand() - 0.5) * 90;
          positions[i * 3 + 1] = -0.3 - rand() * 11;
          positions[i * 3 + 2] = (rand() - 0.5) * 90;
        }
        const pointsGeometry = new T.BufferGeometry();
        pointsGeometry.setAttribute("position", new T.BufferAttribute(positions, 3));
        const pointsMaterial = new T.PointsMaterial({ color:0xa8c6cf, size:this.quality.name === "LOW" ? 0.035 : 0.025, transparent:true, opacity:0.24, depthWrite:false, sizeAttenuation:true });
        this.particles = new T.Points(pointsGeometry, pointsMaterial);
        this.scene.add(this.particles);
      }
    }

    markerPalette() {
      // Do not use white markers on snow/ice. Everest and Antarctica deliberately
      // use warm high-contrast colors so the guide points remain visible.
      const palettes = {
        everest: { ring: 0xffc247, stem: 0xff9b3d, core: 0xff5f3d },
        antarctica: { ring: 0xffb72e, stem: 0xff8a2f, core: 0xff4f3f },
        mariana: { ring: 0x45d4ff, stem: 0x59b9d3, core: 0xffd166 },
        maunakea: { ring: 0xffb04a, stem: 0xff8f42, core: 0xff6542 },
        grandcanyon: { ring: 0xffa647, stem: 0xe77a38, core: 0xff573d }
      };
      return palettes[this.region.id] || palettes.maunakea;
    }

    createEducationalMarkers(observations = []) {
      const T = this.THREE;
      this.disposeEducationalMarkers();
      if (!observations.length) return;
      const palette = this.markerPalette();
      const ringGeometry = new T.TorusGeometry(0.34, 0.024, 8, 30);
      const stemGeometry = new T.CylinderGeometry(0.014, 0.014, 0.52, 8);
      const coreGeometry = new T.OctahedronGeometry(0.12, 0);
      this.observationMarkerResources.push(ringGeometry, stemGeometry, coreGeometry);
      this.observationGroup = new T.Group();
      this.observationGroup.name = `earth-education-markers-${this.region.id}`;
      this.scene.add(this.observationGroup);

      observations.forEach((observation, index) => {
        const y = this.heightAtWorld(observation.x, observation.z);
        const ground = Number.isFinite(y) ? y : 0;
        const marker = new T.Group();
        marker.name = `earth-observation-${observation.id}`;
        marker.position.set(observation.x, ground + 0.04, observation.z);
        marker.userData.observationId = observation.id;
        marker.userData.phase = index * 1.73 + 0.45;

        const ringMaterial = new T.MeshBasicMaterial({ color: palette.ring, transparent: true, opacity: 0.62, depthWrite: false, fog: true });
        const stemMaterial = new T.MeshBasicMaterial({ color: palette.stem, transparent: true, opacity: 0.34, depthWrite: false, fog: true });
        const coreMaterial = new T.MeshBasicMaterial({ color: palette.core, transparent: true, opacity: 0.94, depthWrite: false, fog: true });
        this.observationMarkerResources.push(ringMaterial, stemMaterial, coreMaterial);
        const ring = new T.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.03;
        const stem = new T.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.30;
        const core = new T.Mesh(coreGeometry, coreMaterial);
        core.position.y = 0.62;
        marker.add(ring, stem, core);
        marker.userData.ring = ring;
        marker.userData.core = core;
        marker.userData.materials = { ring: ringMaterial, stem: stemMaterial, core: coreMaterial };
        this.observationGroup.add(marker);
        this.observationMarkers.set(observation.id, marker);
      });
    }

    updateEducationalMarkers(activeId, discoveredIds, dt = 0) {
      this.observationTime += dt;
      for (const [id, marker] of this.observationMarkers) {
        const active = id === activeId;
        const discovered = discoveredIds?.has?.(id);
        const { core, materials } = marker.userData;
        if (!core || !materials) continue;
        const pulse = 1 + Math.sin(this.observationTime * 3.1 + marker.userData.phase) * (active ? 0.11 : 0.035);
        marker.scale.setScalar((active ? 1.22 : discovered ? 0.86 : 1.02) * pulse);
        materials.ring.opacity = active ? 0.98 : discovered ? 0.24 : 0.62;
        materials.stem.opacity = active ? 0.55 : discovered ? 0.12 : 0.34;
        materials.core.opacity = active ? 1 : discovered ? 0.42 : 0.94;
        core.rotation.y += dt * (active ? 1.7 : 0.55);
      }
    }

    disposeEducationalMarkers() {
      if (this.observationGroup) {
        this.scene.remove(this.observationGroup);
        this.observationGroup.clear();
        this.observationGroup = null;
      }
      this.observationMarkers.clear();
      this.observationMarkerResources.forEach(resource => resource?.dispose?.());
      this.observationMarkerResources.length = 0;
    }

    resizeWater() {
      if (!this.water) return;
      const width = Math.max(120, this.bounds.maxX - this.bounds.minX + 20);
      const depth = Math.max(120, this.bounds.maxZ - this.bounds.minZ + 20);
      this.water.geometry.dispose();
      this.water.geometry = new this.THREE.PlaneGeometry(width, depth, 48, 48);
      this.water.geometry.rotateX(-Math.PI / 2);
    }

    updateEnvironment(dt, camera) {
      this.environmentTime += dt;
      if (this.water?.material?.userData?.waveTexture) {
        const wave = this.water.material.userData.waveTexture;
        wave.offset.x = (wave.offset.x + dt * 0.006) % 1;
        wave.offset.y = (wave.offset.y + dt * 0.0035) % 1;
      }
      if (this.sky && camera) this.sky.position.copy(camera.position);
      if (this.particles && camera) {
        this.particles.position.x += (camera.position.x - this.particles.position.x) * Math.min(1, dt * 0.65);
        this.particles.position.z += (camera.position.z - this.particles.position.z) * Math.min(1, dt * 0.65);
        this.particles.rotation.y += dt * 0.012;
      }
    }

    geoAtWorld(x, z) {
      const cos = Math.max(0.08, Math.cos(this.region.latitude * DEG));
      return {
        latitude: this.region.latitude - z / KM_PER_DEG_LAT,
        longitude: wrapLongitude(this.region.longitude + x / (KM_PER_DEG_LAT * cos))
      };
    }

    heightAtWorld(x, z) {
      const geo = this.geoAtWorld(x, z);
      return this.provider.sampleCached(geo.latitude, geo.longitude, this.region.zoom);
    }

    distanceToFeature(x, z) { return Math.hypot(x, z); }

    update(camera) {
      this.projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      this.frustum.setFromProjectionMatrix(this.projection);
      camera.getWorldDirection(this.forward);
      for (const entry of this.entries.values()) {
        const targetSegments = this.desiredSegments(entry, camera);
        if (targetSegments !== entry.currentSegments) {
          entry.mesh.geometry = this.geometryFor(entry, targetSegments);
          entry.currentSegments = targetSegments;
        }
        this.toChunk.set(entry.center.x - camera.position.x, 0, entry.center.z - camera.position.z);
        const distance = Math.max(0.001, this.toChunk.length());
        const facing = this.toChunk.normalize().dot(this.forward);
        const safelyBehind = facing < -0.62 && distance > 32;
        entry.mesh.visible = !safelyBehind;
      }
    }

    clampPosition(position) {
      const margin = 4;
      const b = this.playBounds || this.bounds;
      const beforeX = position.x, beforeZ = position.z;
      position.x = clamp(position.x, b.minX + margin, b.maxX - margin);
      position.z = clamp(position.z, b.minZ + margin, b.maxZ - margin);
      return Math.abs(beforeX - position.x) > 0.0001 || Math.abs(beforeZ - position.z) > 0.0001;
    }

    dispose() {
      this.disposeEducationalMarkers();
      for (const entry of this.entries.values()) {
        this.scene.remove(entry.mesh);
        for (const geometry of entry.geometries.values()) geometry.dispose();
      }
      this.entries.clear();
      if (this.water) {
        this.scene.remove(this.water);
        this.water.geometry.dispose();
        this.water.material.userData.waveTexture?.dispose?.();
        this.water.material.dispose();
        this.water = null;
      }
      if (this.sky) {
        this.scene.remove(this.sky);
        this.sky.geometry.dispose();
        this.sky.material.dispose();
        this.sky = null;
      }
      if (this.particles) {
        this.scene.remove(this.particles);
        this.particles.geometry.dispose();
        this.particles.material.dispose();
        this.particles = null;
      }
      const textures = this.material.userData.surfaceTextures || {};
      Object.values(textures).forEach(texture => texture?.dispose?.());
      this.material.dispose();
    }
  }

  class EarthFullInput {
    constructor(controller) {
      this.controller = controller;
      this.keys = new Set();
      this.mobile = new Set();
      this.dragging = false;
      this.pointerId = null;
      this.last = { x: 0, y: 0 };
      this.hadPointerLock = false;
      this.bind();
    }

    interactive() {
      return this.controller.state === STATES.ACTIVE && !this.controller.isObservationCardOpen();
    }

    bind() {
      document.addEventListener("keydown", event => {
        if (!this.controller.active) return;
        const key = event.key.toLowerCase();
        if (!["w","a","s","d","q","e","shift","escape"].includes(key)) return;
        event.preventDefault();
        event.stopImmediatePropagation();

        if (key === "escape") {
          if (event.repeat) return;
          if (this.controller.isObservationCardOpen()) {
            this.controller.closeObservationCard();
            this.reset();
            return;
          }
          if (this.controller.actionsMenuOpen) {
            this.controller.setActionsMenu(false);
            this.reset();
            return;
          }
          if (this.controller.infoOpen) {
            this.controller.hideRegionInfo(false);
            this.reset();
            return;
          }
          if (this.controller.objectivesOpen) {
            this.controller.collapseObjectives(false);
            this.reset();
            return;
          }
          if (this.controller.state === STATES.SELECTING && this.controller.terrain) {
            this.controller.closeSelectorToRegion();
            this.reset();
            return;
          }
          if (document.pointerLockElement === this.controller.viewport) document.exitPointerLock?.();
          this.controller.exit();
          return;
        }

        if (!this.interactive()) return;
        if (key === "e" && !event.repeat && this.controller.tryObserveNearby()) {
          this.keys.delete("e");
          this.controller.dismissTutorial();
          return;
        }
        this.keys.add(key);
        this.controller.dismissTutorial();
      });

      document.addEventListener("keyup", event => {
        const key = event.key.toLowerCase();
        if (["w","a","s","d","q","e","shift"].includes(key)) this.keys.delete(key);
      });

      this.controller.viewport.addEventListener("click", event => {
        if (!this.interactive() || event.pointerType === "touch" || matchMedia("(pointer: coarse)").matches) return;
        if (event.target.closest("button,a,input,summary")) return;
        this.controller.viewport.requestPointerLock?.();
      });

      document.addEventListener("pointerlockchange", () => {
        const locked = document.pointerLockElement === this.controller.viewport;
        this.hadPointerLock = locked || this.hadPointerLock;
        this.controller.root.classList.toggle("is-pointer-locked", locked);
        if (!locked) this.keys.clear();
      });

      document.addEventListener("mousemove", event => {
        if (!this.interactive() || document.pointerLockElement !== this.controller.viewport) return;
        this.controller.addLookDelta(event.movementX, event.movementY, "locked");
      });

      this.controller.viewport.addEventListener("pointerdown", event => {
        if (!this.interactive() || event.pointerType === "mouse") return;
        if (event.target.closest("button,a,input,summary")) return;
        this.dragging = true;
        this.pointerId = event.pointerId;
        this.last = { x:event.clientX, y:event.clientY };
        this.controller.viewport.setPointerCapture?.(event.pointerId);
      });

      this.controller.viewport.addEventListener("pointermove", event => {
        if (!this.dragging || event.pointerId !== this.pointerId || !this.interactive()) return;
        const dx = event.clientX - this.last.x;
        const dy = event.clientY - this.last.y;
        this.last = { x:event.clientX, y:event.clientY };
        this.controller.addLookDelta(dx, dy, "touch");
      });

      const end = event => {
        if (event.pointerId !== this.pointerId) return;
        this.dragging = false;
        this.pointerId = null;
      };
      this.controller.viewport.addEventListener("pointerup", end);
      this.controller.viewport.addEventListener("pointercancel", end);

      document.querySelectorAll("[data-earth-control]").forEach(button => {
        const action = button.dataset.earthControl;
        const down = event => {
          if (!this.interactive()) return;
          event.preventDefault();
          this.mobile.add(action);
          button.setPointerCapture?.(event.pointerId);
          this.controller.dismissTutorial();
        };
        const up = event => {
          event.preventDefault();
          this.mobile.delete(action);
        };
        button.addEventListener("pointerdown", down);
        button.addEventListener("pointerup", up);
        button.addEventListener("pointercancel", up);
        button.addEventListener("pointerleave", up);
      });
    }

    pressed(key) { return this.keys.has(key.toLowerCase()); }
    mobilePressed(action) { return this.mobile.has(action); }
    reset() {
      this.keys.clear();
      this.mobile.clear();
      this.dragging = false;
      this.pointerId = null;
    }
  }

  window.EarthFullExploration = class EarthFullExploration {
    constructor(earth) {
      this.earth = earth;
      this.root = document.getElementById("earth-full-exploration");
      this.viewport = document.getElementById("earth-full-viewport");
      this.entryButton = document.getElementById("earth-full-explore-button");
      this.selector = document.getElementById("earth-region-selector");
      this.selectorGrid = document.getElementById("earth-region-grid");
      this.selectorClose = document.getElementById("earth-region-selector-close");
      this.qualityPanel = document.getElementById("earth-quality-panel");
      this.qualityOptions = document.getElementById("earth-quality-options");
      this.qualityClose = document.getElementById("earth-quality-close");
      this.qualityStart = document.getElementById("earth-quality-start");
      this.qualitySelectedLabel = document.getElementById("earth-quality-selected-label");
      this.qualityDeviceNote = document.getElementById("earth-quality-device-note");
      this.exitButton = document.getElementById("earth-full-exit");
      this.regionButton = document.getElementById("earth-region-toggle");
      this.fullscreenButton = document.getElementById("earth-fullscreen-toggle");
      this.actionsMenu = document.getElementById("earth-actions-menu");
      this.actionsMenuToggle = document.getElementById("earth-actions-menu-toggle");
      this.loading = document.getElementById("earth-full-loading");
      this.loadingStatus = document.getElementById("earth-full-loading-status");
      this.loadingProgress = document.getElementById("earth-full-loading-progress");
      this.errorPanel = document.getElementById("earth-full-error");
      this.errorMessage = document.getElementById("earth-full-error-message");
      this.errorReturn = document.getElementById("earth-full-error-return");
      this.tutorial = document.getElementById("earth-full-tutorial");
      this.tutorialClose = document.getElementById("earth-tutorial-close");
      this.boundaryHint = document.getElementById("earth-boundary-hint");
      this.travelVeil = document.getElementById("earth-travel-veil");
      this.travelLabel = document.getElementById("earth-travel-label");

      this.hudLocation = document.getElementById("earth-hud-location");
      this.hudCoordinates = document.getElementById("earth-hud-coordinates");
      this.hudAltitude = document.getElementById("earth-hud-altitude");
      this.hudTerrain = document.getElementById("earth-hud-terrain");
      this.hudDistance = document.getElementById("earth-hud-distance");
      this.hudSpeed = document.getElementById("earth-hud-speed");
      this.hudData = document.getElementById("earth-hud-data");
      this.hudQuality = document.getElementById("earth-hud-quality");

      this.infoCard = document.getElementById("earth-landmark-card");
      this.infoMinimize = document.getElementById("earth-landmark-minimize");
      this.infoToggle = document.getElementById("earth-info-toggle");
      this.infoName = document.getElementById("earth-landmark-name");
      this.infoType = document.getElementById("earth-landmark-type");
      this.infoCoords = document.getElementById("earth-landmark-coords");
      this.infoDescription = document.getElementById("earth-landmark-description");
      this.infoFacts = document.getElementById("earth-landmark-facts");
      this.infoSource = document.getElementById("earth-landmark-source");
      this.infoMedia = document.getElementById("earth-landmark-media");
      this.infoImage = document.getElementById("earth-landmark-image");
      this.infoImageCaption = document.getElementById("earth-landmark-image-caption");

      this.objectivesPanel = document.getElementById("earth-objectives-panel");
      this.objectivesRegion = document.getElementById("earth-objectives-region");
      this.objectivesIntro = document.getElementById("earth-objectives-intro");
      this.objectivesList = document.getElementById("earth-objectives-list");
      this.objectivesCollapse = document.getElementById("earth-objectives-collapse");
      this.objectivesToggle = document.getElementById("earth-objectives-toggle");
      this.discoveryCount = document.getElementById("earth-discovery-count");
      this.discoveryBar = document.getElementById("earth-discovery-bar");
      this.nextTarget = document.getElementById("earth-next-target");
      this.nextTargetName = document.getElementById("earth-next-target-name");
      this.nextTargetDistance = document.getElementById("earth-next-target-distance");

      this.observationPrompt = document.getElementById("earth-observation-prompt");
      this.observationPromptTitle = document.getElementById("earth-observation-prompt-title");
      this.observeButton = document.getElementById("earth-observe-button");
      this.observationCard = document.getElementById("earth-observation-card");
      this.observationClose = document.getElementById("earth-observation-close");
      this.observationType = document.getElementById("earth-observation-type");
      this.observationStatus = document.getElementById("earth-observation-status");
      this.observationTitle = document.getElementById("earth-observation-title");
      this.observationMeta = document.getElementById("earth-observation-meta");
      this.observationLead = document.getElementById("earth-observation-lead");
      this.observationSections = document.getElementById("earth-observation-sections");
      this.observationWhy = document.getElementById("earth-observation-why");
      this.observationMore = document.getElementById("earth-observation-more");
      this.observationDeep = document.getElementById("earth-observation-deep");
      this.observationSource = document.getElementById("earth-observation-source");

      this.state = STATES.IDLE;
      this.region = REGIONS[0];
      this.provider = null;
      this.terrain = null;
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.hemiLight = null;
      this.sunLight = null;
      this.fillLight = null;
      this.frame = null;
      this.previous = 0;
      this.transitionToken = 0;
      this.preparingPromise = null;
      this.speed = 0;
      this.yaw = 0;
      this.pitch = -0.2;
      this.lookYawTarget = 0;
      this.lookPitchTarget = -0.2;
      this.velocity = { x:0, y:0, z:0 };
      this.finalCameraY = 0;
      this.actionsMenuOpen = false;
      this.objectivesOpen = false;
      this.infoOpen = false;
      this.selectorOpenedFromRegion = false;
      this.nearbyObservation = null;
      this.activeObservation = null;
      this.discovered = new Set();
      this.educationClock = 0;
      this.hudClock = 0;
      this.statsClock = 0;
      this.statsFrames = 0;
      this.lowFpsWindows = 0;
      this.highFpsWindows = 0;
      this.boundaryTimeout = 0;
      this.tutorialTimeout = 0;

      this.recommendedQualityName = this.detectRecommendedQualityName();
      this.selectedQualityName = this.readSavedQualityName() || this.recommendedQualityName;
      this.quality = copyQualityProfile(this.selectedQualityName);
      this.currentDpr = 1;
      this.idealDpr = 1;

      this.input = new EarthFullInput(this);
      this.root.inert = true;
      this.buildSelector();
      this.bindUI();
      this.updateQualityPanel();
    }

    get active() { return this.state !== STATES.IDLE; }

    detectRecommendedQualityName() {
      const cores = navigator.hardwareConcurrency || 4;
      const memory = navigator.deviceMemory || 0;
      const coarse = matchMedia("(pointer: coarse)").matches;
      const pixels = Math.max(1, innerWidth * innerHeight * Math.min(devicePixelRatio || 1, 3) ** 2);
      let score = 0;
      if (coarse || innerWidth < 760) score -= 2;
      if (cores >= 12) score += 3;
      else if (cores >= 8) score += 2;
      else if (cores <= 4) score -= 2;
      if (memory >= 8) score += 2;
      else if (memory >= 6) score += 1;
      else if (memory > 0 && memory <= 3) score -= 2;
      if (pixels > 5_500_000) score -= 1;
      if (score >= 4) return "HIGH";
      if (score <= -1) return "LOW";
      return "MEDIUM";
    }

    readSavedQualityName() {
      try {
        const saved = localStorage.getItem(EARTH_QUALITY_STORAGE_KEY);
        return QUALITY_PROFILES[saved] ? saved : null;
      } catch { return null; }
    }

    setQualityChoice(name, persist = false) {
      if (!QUALITY_PROFILES[name]) return;
      this.selectedQualityName = name;
      this.quality = copyQualityProfile(name);
      if (persist) {
        try { localStorage.setItem(EARTH_QUALITY_STORAGE_KEY, name); } catch {}
      }
      this.updateQualityPanel();
    }

    updateQualityPanel() {
      this.qualityOptions?.querySelectorAll("[data-earth-quality]").forEach(button => {
        const selected = button.dataset.earthQuality === this.selectedQualityName;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-checked", String(selected));
        const rec = button.querySelector("[data-quality-recommendation]");
        if (rec) rec.textContent = button.dataset.earthQuality === this.recommendedQualityName ? "DIREKOMENDASIKAN" : "";
      });
      if (this.qualitySelectedLabel) this.qualitySelectedLabel.textContent = QUALITY_PROFILES[this.selectedQualityName].label;
      if (this.qualityDeviceNote) {
        const mobile = matchMedia("(pointer: coarse)").matches || innerWidth < 760;
        this.qualityDeviceNote.textContent = mobile
          ? `Rekomendasi perangkat ini: ${QUALITY_PROFILES[this.recommendedQualityName].label}. Mode rendah paling aman untuk HP.`
          : `Rekomendasi perangkat ini: ${QUALITY_PROFILES[this.recommendedQualityName].label}.`;
      }
    }

    calculateDpr() {
      const pixels = Math.max(1, (this.viewport.clientWidth || innerWidth) * (this.viewport.clientHeight || innerHeight));
      return clamp(Math.min(devicePixelRatio || 1, this.quality.maxDpr, Math.sqrt(this.quality.pixelBudget / pixels)), this.quality.minDpr, this.quality.maxDpr);
    }

    buildSelector() {
      const fragment = document.createDocumentFragment();
      REGIONS.forEach((region, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "earth-region-card";
        button.dataset.earthRegion = region.id;
        button.innerHTML = `<span class="earth-region-preview earth-region-preview-${region.id}" aria-hidden="true"><i></i><b>${region.short}</b></span><span class="earth-region-card-top"><span class="earth-region-index">${String(index + 1).padStart(2, "0")}</span><span class="earth-region-current">${this.region?.id === region.id ? "AKTIF" : "PILIH"}</span></span><strong>${region.name}</strong><span class="earth-region-descriptor">${region.descriptor}</span><small>${formatLatLon(region.latitude, region.longitude)}</small><em>${region.mode === "underwater" ? "BATHYMETRY" : region.mode === "coastal" ? "LAND + OCEAN" : "REAL DEM"}</em><span class="earth-region-source">${region.sourceLabel}</span>`;
        button.classList.toggle("is-current", this.region?.id === region.id);
        button.setAttribute("aria-pressed", String(this.region?.id === region.id));
        fragment.append(button);
      });
      this.selectorGrid.replaceChildren(fragment);
    }

    updateSelectorCurrentRegion() {
      this.selectorGrid?.querySelectorAll?.("[data-earth-region]").forEach(button => {
        const current = button.dataset.earthRegion === this.region?.id;
        button.classList.toggle("is-current", current);
        button.setAttribute("aria-pressed", String(current));
        const status = button.querySelector(".earth-region-current");
        if (status) status.textContent = current ? "AKTIF" : "PILIH";
      });
    }

    bindUI() {
      this.entryButton.addEventListener("click", () => this.enter());
      this.qualityOptions?.addEventListener("click", event => {
        const button = event.target.closest("[data-earth-quality]");
        if (button) this.setQualityChoice(button.dataset.earthQuality);
      });
      this.qualityStart?.addEventListener("click", () => this.confirmQualitySelection());
      this.qualityClose?.addEventListener("click", () => this.cancelPreEntry());

      this.selectorGrid.addEventListener("click", event => {
        const button = event.target.closest("[data-earth-region]");
        if (!button) return;
        const region = REGIONS.find(item => item.id === button.dataset.earthRegion);
        if (region) this.enterRegion(region);
      });
      this.selectorClose.addEventListener("click", () => {
        if (this.terrain) this.closeSelectorToRegion();
        else this.cancelPreEntry();
      });

      this.exitButton.addEventListener("click", () => this.exit());
      this.regionButton.addEventListener("click", () => this.openSelectorFromRegion());
      this.fullscreenButton.addEventListener("click", () => this.toggleFullscreen());
      this.actionsMenuToggle?.addEventListener("click", () => this.setActionsMenu(!this.actionsMenuOpen, true));
      this.errorReturn.addEventListener("click", () => this.failBack());
      this.tutorialClose.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        this.dismissTutorial(true);
      });

      const bindPanelButton = (button, handler) => {
        if (!button) return;
        button.addEventListener("pointerdown", event => event.stopPropagation());
        button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          handler();
        });
      };
      bindPanelButton(this.objectivesCollapse, () => this.collapseObjectives(true));
      bindPanelButton(this.objectivesToggle, () => this.expandObjectives(true));
      this.observeButton?.addEventListener("click", () => this.tryObserveNearby());
      this.observationClose?.addEventListener("click", () => this.closeObservationCard(true));
      bindPanelButton(this.infoMinimize, () => this.hideRegionInfo(true));
      bindPanelButton(this.infoToggle, () => this.showRegionInfo(true));

      document.addEventListener("fullscreenchange", () => this.updateFullscreenLabel());
      window.addEventListener("resize", () => {
        this.resize();
        this.updateResponsiveUi();
      });
      document.addEventListener("visibilitychange", () => {
        if (!this.active) return;
        if (document.hidden) this.stopLoop();
        else if ([STATES.ENTERING, STATES.ACTIVE, STATES.EXITING, STATES.SELECTING].includes(this.state) && this.renderer) this.startLoop();
      });
    }

    isMobileUi() {
      return matchMedia("(pointer: coarse)").matches || innerWidth <= 760;
    }

    setActionsMenu(open, focus = false) {
      this.actionsMenuOpen = Boolean(open);
      this.root.classList.toggle("is-actions-open", this.actionsMenuOpen);
      this.actionsMenuToggle?.setAttribute("aria-expanded", String(this.actionsMenuOpen));
      if (focus && this.actionsMenuOpen) requestAnimationFrame(() => this.actionsMenu?.querySelector("button")?.focus({ preventScroll:true }));
    }

    updateResponsiveUi() {
      if (!this.active) return;
      const compact = this.isMobileUi();
      this.root.classList.toggle("is-compact-ui", compact);
      if (!compact) {
        this.actionsMenuOpen = true;
        this.root.classList.add("is-actions-open");
        this.actionsMenuToggle?.setAttribute("aria-expanded", "true");
      } else if (this.state !== STATES.CONFIGURING && this.state !== STATES.SELECTING) {
        this.setActionsMenu(false);
      }
    }

    enter() {
      if (!this.earth.active || this.earth.travelMode || this.state !== STATES.IDLE) return;
      this.entryButton.disabled = true;
      this.state = STATES.CONFIGURING;
      this.root.hidden = false;
      this.root.inert = false;
      this.root.setAttribute("aria-hidden", "false");
      this.root.className = "earth-full-exploration is-configuring";
      this.qualityPanel.hidden = false;
      this.selector.hidden = true;
      this.loading.hidden = true;
      this.errorPanel.hidden = true;
      this.earth.beginFullExplorationFocus?.(null);
      document.getElementById("mission").classList.add("is-earth-full-selecting");
      this.updateQualityPanel();
      this.updateResponsiveUi();
      document.getElementById("announcement").textContent = "Pilih kualitas grafis sebelum memulai Eksplorasi Pengalaman Penuh Bumi.";
      requestAnimationFrame(() => this.qualityOptions?.querySelector('[aria-checked="true"]')?.focus({ preventScroll:true }));
    }

    confirmQualitySelection() {
      if (this.state !== STATES.CONFIGURING) return;
      this.setQualityChoice(this.selectedQualityName, true);
      this.qualityPanel.hidden = true;
      this.selector.hidden = false;
      this.state = STATES.SELECTING;
      this.root.className = "earth-full-exploration is-selecting";
      document.getElementById("announcement").textContent = "Pilih wilayah Bumi untuk dijelajahi.";
      requestAnimationFrame(() => this.selector.querySelector("[data-earth-region]")?.focus({ preventScroll:true }));
    }

    cancelPreEntry() {
      this.transitionToken += 1;
      this.stopLoop();
      this.input.reset();
      this.disposeTerrain();
      this.disposeRenderer();
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.root.className = "earth-full-exploration";
      this.qualityPanel.hidden = true;
      this.selector.hidden = false;
      this.loading.hidden = true;
      this.errorPanel.hidden = true;
      document.getElementById("mission").classList.remove("is-earth-full", "is-earth-full-selecting");
      this.earth.endFullExplorationFocus?.();
      this.state = STATES.IDLE;
      this.entryButton.disabled = false;
      document.getElementById("announcement").textContent = "Kembali ke panorama Bumi.";
    }

    setLoading(progress, text) {
      this.loading.hidden = false;
      this.loadingProgress.style.transform = `scaleX(${clamp(progress, 0, 1)})`;
      this.loadingStatus.textContent = text;
    }

    async enterRegion(region) {
      if (![STATES.SELECTING, STATES.ACTIVE].includes(this.state)) return;
      const switching = Boolean(this.terrain);
      const token = ++this.transitionToken;
      this.input.reset();
      this.region = region;
      this.state = STATES.PREPARING;
      this.selector.hidden = true;
      this.qualityPanel.hidden = true;
      this.errorPanel.hidden = true;
      this.root.classList.remove("is-selecting", "is-error", "is-active", "is-observation-open", "is-info-open", "is-objectives-open");
      this.root.classList.add("is-preparing");
      this.setActionsMenu(false);
      document.getElementById("mission").classList.remove("is-earth-full-selecting");
      document.getElementById("mission").classList.add("is-earth-full");
      this.earth.beginFullExplorationFocus?.(region);
      this.travelLabel.textContent = switching ? `PINDAH KE ${region.short.toUpperCase()}` : `TURUN KE ${region.short.toUpperCase()}`;
      this.travelVeil.classList.toggle("is-visible", switching);
      this.setLoading(0.04, `MENGUNCI KOORDINAT ${region.short.toUpperCase()}`);
      document.getElementById("announcement").textContent = `Menyiapkan terrain real ${region.name}.`;

      try {
        await this.prepareRenderer();
        if (token !== this.transitionToken) return;
        this.setLoading(0.12, "MENGUNDUH TILE ELEVASI REAL");
        await this.loadRegionTerrain(region, token);
        if (token !== this.transitionToken) return;
        this.setLoading(1, "WILAYAH SIAP");
        await wait(matchMedia("(prefers-reduced-motion: reduce)").matches ? 40 : 160);
        if (token !== this.transitionToken) return;
        if (switching) await this.runRegionSwitchTransition(token);
        else await this.runEntryTransition(token);
      } catch (error) {
        if (token !== this.transitionToken) return;
        this.showError(error);
      }
    }

    async prepareRenderer() {
      if (this.renderer) return;
      if (this.preparingPromise) return this.preparingPromise;
      const promise = (async () => {
        await this.earth.prepare();
        if (!this.earth.THREE) throw new Error("Renderer 3D Bumi tidak tersedia pada perangkat ini.");
        const T = this.earth.THREE;
        this.THREE = T;
        const canvas = document.createElement("canvas");
        canvas.className = "earth-full-canvas";
        canvas.setAttribute("aria-hidden", "true");
        const context = canvas.getContext("webgl2", { alpha:true, antialias:this.quality.name !== "LOW", powerPreference:"high-performance" });
        if (!context) throw new Error("WebGL2 diperlukan untuk Eksplorasi Pengalaman Penuh Bumi.");
        this.renderer = new T.WebGLRenderer({ canvas, context, alpha:true, antialias:this.quality.name !== "LOW" });
        this.renderer.outputColorSpace = T.SRGBColorSpace;
        this.renderer.toneMapping = T.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;
        this.idealDpr = this.calculateDpr();
        this.currentDpr = this.idealDpr;
        this.renderer.setPixelRatio(this.currentDpr);
        this.renderer.setClearColor(0x071522, 1);
        this.viewport.replaceChildren(canvas);

        this.scene = new T.Scene();
        this.scene.fog = new T.FogExp2(0x9bb5c3, 0.006);
        this.camera = new T.PerspectiveCamera(this.mobileFov(), 1, 0.02, 760);
        this.camera.rotation.order = "YXZ";
        this.hemiLight = new T.HemisphereLight(0xd9edff, 0x3d322b, 0.78);
        this.sunLight = new T.DirectionalLight(0xfff0d2, 2.6);
        this.sunLight.position.set(-45, 70, 35);
        this.fillLight = new T.DirectionalLight(0x91b9dc, 0.24);
        this.fillLight.position.set(45, 20, -30);
        this.scene.add(this.hemiLight, this.sunLight, this.fillLight);

        this.move = new T.Vector3();
        this.forward = new T.Vector3();
        this.right = new T.Vector3();
        this.resize();
      })();
      this.preparingPromise = promise;
      try { await promise; }
      finally { if (this.preparingPromise === promise) this.preparingPromise = null; }
    }

    mobileFov() { return innerWidth < 760 ? 66 : 58; }

    async loadRegionTerrain(region, token) {
      this.disposeTerrain();
      this.provider = new TerrariumProvider();
      this.terrain = new EarthTerrainManager(this.THREE, this.scene, this.renderer, this.provider, region, this.quality);
      await this.terrain.loadCore(progress => this.setLoading(0.12 + progress * 0.68, `MEMBANGUN TERRAIN REAL · ${Math.round(progress * 100)}%`));
      if (token !== this.transitionToken) return;
      this.setCameraForRegion(region, true);
      this.updateRegionUI();
      this.setupEducationUI();
      void this.terrain.loadExtended().catch(() => {});
    }

    setCameraForRegion(region, entry = false) {
      const ground = this.terrain.heightAtWorld(0, 0) ?? 0;
      const zOffset = region.id === "grandcanyon" ? 11 : region.id === "antarctica" ? 14 : region.id === "mariana" ? 18 : 12;
      const targetY = Number.isFinite(region.startAbsoluteY) ? region.startAbsoluteY : ground + region.startAltitude;
      this.finalCameraY = targetY;
      const startY = entry
        ? (region.id === "mariana" ? Math.max(7.5, targetY + 9.5) : targetY + (this.isMobileUi() ? 6.5 : 10.5))
        : targetY;
      this.camera.position.set(0, startY, zOffset);
      this.yaw = region.yaw || 0;
      this.pitch = entry ? clamp((region.pitch || -0.2) - 0.10, -0.55, 0.2) : (region.pitch || -0.2);
      this.lookYawTarget = this.yaw;
      this.lookPitchTarget = region.pitch || -0.2;
      this.velocity.x = this.velocity.y = this.velocity.z = 0;
      this.applyCameraRotation();
      this.terrain.clampPosition(this.camera.position);
    }

    async runEntryTransition(token) {
      this.state = STATES.ENTERING;
      this.root.classList.remove("is-preparing");
      this.root.classList.add("is-entering");
      this.loading.hidden = true;
      this.root.style.setProperty("--surface-opacity", "0.12");
      this.root.style.setProperty("--entry-progress", "0");
      this.startLoop();

      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = reduced ? 220 : 3300;
      const startY = this.camera.position.y;
      const start = performance.now();
      let handedOff = false;

      await new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken || this.state !== STATES.ENTERING) return resolve();
          const raw = clamp((now - start) / duration, 0, 1);
          const eased = smoothstep(raw);
          this.root.style.setProperty("--surface-opacity", String(clamp((raw - 0.08) / 0.55, 0.12, 1)));
          this.root.style.setProperty("--entry-progress", String(eased));
          this.camera.position.y = lerp(startY, this.finalCameraY, smoothstep(clamp((raw - 0.18) / 0.82, 0, 1)));
          this.pitch = lerp(this.pitch, this.lookPitchTarget, Math.min(1, raw * 0.055));
          this.applyCameraRotation();
          if (!handedOff && raw >= 0.58) {
            handedOff = true;
            this.earth.completeFullExplorationHandoff?.();
          }
          if (raw < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
      if (token !== this.transitionToken) return;
      this.activateRegion();
    }

    async runRegionSwitchTransition(token) {
      this.loading.hidden = true;
      this.travelVeil.classList.add("is-visible", "is-covered");
      this.earth.completeFullExplorationHandoff?.();
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      await wait(reduced ? 80 : 420);
      if (token !== this.transitionToken) return;
      this.camera.position.y = this.finalCameraY;
      this.travelVeil.classList.remove("is-covered");
      await wait(reduced ? 40 : 380);
      if (token !== this.transitionToken) return;
      this.travelVeil.classList.remove("is-visible");
      this.activateRegion();
    }

    activateRegion() {
      this.state = STATES.ACTIVE;
      this.root.classList.remove("is-preparing", "is-entering", "is-selecting");
      this.root.classList.add("is-active", "is-surface-visible");
      this.root.style.setProperty("--surface-opacity", "1");
      this.root.style.setProperty("--entry-progress", "1");
      this.earth.completeFullExplorationHandoff?.();
      this.previous = performance.now();
      this.startLoop();
      this.showTutorial();
      this.infoOpen = false;
      this.objectivesOpen = !this.isMobileUi();
      this.syncEducationPanels();
      this.updateResponsiveUi();
      this.updateHUD(true);
      this.updateEducation(true);
      window.AntaraProgress?.trackFull("earth", this.region.id, this.region.name);
      document.getElementById("announcement").textContent = `Eksplorasi Bumi aktif di ${this.region.name}. Ikuti tujuan eksplorasi dan amati titik menarik di sekitar terrain.`;
    }

    addLookDelta(dx, dy, source = "mouse") {
      const sensitivity = source === "touch" ? 0.0034 : 0.0019;
      this.lookYawTarget -= dx * sensitivity;
      this.lookPitchTarget = clamp(this.lookPitchTarget - dy * sensitivity, -1.35, 0.82);
    }

    applyCameraRotation() {
      if (this.camera) this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
    }

    startLoop() {
      if (!this.renderer || this.frame || ![STATES.ENTERING, STATES.ACTIVE, STATES.EXITING, STATES.SELECTING].includes(this.state)) return;
      this.previous = performance.now();
      const tick = now => {
        if (!this.renderer || ![STATES.ENTERING, STATES.ACTIVE, STATES.EXITING, STATES.SELECTING].includes(this.state)) {
          this.frame = null;
          return;
        }
        const dt = Math.min(0.05, Math.max(0.001, (now - this.previous) / 1000));
        this.previous = now;
        if (this.state === STATES.ACTIVE) this.update(dt);
        else if (this.terrain && this.camera) {
          this.terrain.update(this.camera);
          this.terrain.updateEnvironment(dt, this.camera);
        }
        this.renderer.render(this.scene, this.camera);
        this.statsClock += dt;
        this.statsFrames += 1;
        this.adaptResolution();
        this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    }

    stopLoop() {
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = null;
    }

    update(dt) {
      const lookResponse = 1 - Math.exp(-dt * 22);
      this.yaw += (this.lookYawTarget - this.yaw) * lookResponse;
      this.pitch += (this.lookPitchTarget - this.pitch) * lookResponse;
      this.pitch = clamp(this.pitch, -1.35, 0.82);
      this.applyCameraRotation();

      const boost = this.input.pressed("shift");
      const base = this.region.id === "mariana" ? 2.2 : 3.2;
      const targetSpeed = base * (boost ? 2.4 : 1);
      let forward = 0, strafe = 0, vertical = 0;
      if (this.input.pressed("w") || this.input.mobilePressed("forward")) forward += 1;
      if (this.input.pressed("s") || this.input.mobilePressed("backward")) forward -= 1;
      if (this.input.pressed("d") || this.input.mobilePressed("right")) strafe += 1;
      if (this.input.pressed("a") || this.input.mobilePressed("left")) strafe -= 1;
      if (this.input.pressed("e") || this.input.mobilePressed("up")) vertical += 1;
      if (this.input.pressed("q") || this.input.mobilePressed("down")) vertical -= 1;

      this.forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      this.right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      this.move.set(0,0,0).addScaledVector(this.forward, forward).addScaledVector(this.right, strafe);
      if (this.move.lengthSq() > 1) this.move.normalize();

      const response = 1 - Math.exp(-dt * (boost ? 7.5 : 5.5));
      const targetVX = this.move.x * targetSpeed;
      const targetVZ = this.move.z * targetSpeed;
      const targetVY = vertical * targetSpeed * 0.62;
      this.velocity.x = lerp(this.velocity.x, targetVX, response);
      this.velocity.z = lerp(this.velocity.z, targetVZ, response);
      this.velocity.y = lerp(this.velocity.y, targetVY, response);

      this.camera.position.x += this.velocity.x * dt;
      this.camera.position.z += this.velocity.z * dt;
      this.camera.position.y += this.velocity.y * dt;
      const hitBoundary = this.terrain.clampPosition(this.camera.position);
      if (hitBoundary) {
        this.velocity.x *= 0.12;
        this.velocity.z *= 0.12;
        this.showBoundaryHint();
      }

      const ground = this.terrain.heightAtWorld(this.camera.position.x, this.camera.position.z);
      if (ground != null) {
        const minClearance = this.region.id === "mariana" ? 0.18 : 0.12;
        const maxY = ground + this.region.maxClearance;
        const minY = ground + minClearance;
        if (this.camera.position.y < minY) {
          this.camera.position.y = minY;
          this.velocity.y = Math.max(0, this.velocity.y);
        }
        if (this.camera.position.y > maxY) {
          this.camera.position.y = maxY;
          this.velocity.y = Math.min(0, this.velocity.y);
        }
      }

      this.speed = Math.hypot(this.velocity.x, this.velocity.z, this.velocity.y);
      this.terrain.update(this.camera);
      this.terrain.updateEnvironment(dt, this.camera);
      this.terrain.updateEducationalMarkers(this.nearbyObservation?.id || null, this.discovered, dt);
      this.updateEnvironment();

      this.hudClock += dt;
      this.educationClock += dt;
      if (this.hudClock >= 0.10) {
        this.hudClock = 0;
        this.updateHUD();
      }
      if (this.educationClock >= 0.16) {
        this.educationClock = 0;
        this.updateEducation();
      }
    }

    updateEnvironment() {
      if (!this.scene?.fog) return;
      const visual = REGION_VISUALS[this.region.id] || REGION_VISUALS.maunakea;
      const underwater = this.region.id === "mariana" && this.camera.position.y < -0.05;
      if (underwater) {
        const depth = clamp(Math.abs(this.camera.position.y) / 10.5, 0, 1);
        this.scene.fog.color.set(0x082c3c).lerp(new this.THREE.Color(0x03151f), depth * 0.72);
        this.scene.fog.density = lerp(0.018, 0.052, depth);
        this.renderer.setClearColor(new this.THREE.Color(0x0c3a4d).lerp(new this.THREE.Color(0x02111a), depth * 0.78), 1);
        this.root.classList.add("is-underwater");
      } else {
        this.scene.fog.color.set(visual.fog);
        this.scene.fog.density = visual.fogDensity;
        this.renderer.setClearColor(visual.skyHorizon, 1);
        this.root.classList.remove("is-underwater");
      }
    }

    adaptResolution() {
      if (this.statsClock < 2.5 || !this.renderer) return;
      const fps = this.statsFrames / this.statsClock;
      this.statsClock = 0;
      this.statsFrames = 0;
      this.idealDpr = this.calculateDpr();
      if (fps < 38) { this.lowFpsWindows += 1; this.highFpsWindows = 0; }
      else if (fps > 56) { this.highFpsWindows += 1; this.lowFpsWindows = Math.max(0, this.lowFpsWindows - 1); }
      else { this.lowFpsWindows = Math.max(0, this.lowFpsWindows - 1); this.highFpsWindows = 0; }

      if (this.lowFpsWindows >= 2 && this.currentDpr > this.quality.minDpr) {
        this.currentDpr = Math.max(this.quality.minDpr, this.currentDpr - 0.12);
        this.renderer.setPixelRatio(this.currentDpr);
        this.resize(false);
        this.lowFpsWindows = 0;
      } else if (this.highFpsWindows >= 3 && this.currentDpr + 0.04 < this.idealDpr) {
        this.currentDpr = Math.min(this.idealDpr, this.currentDpr + 0.10);
        this.renderer.setPixelRatio(this.currentDpr);
        this.resize(false);
        this.highFpsWindows = 0;
      }
    }

    updateHUD(force = false) {
      if (!this.terrain || !this.camera) return;
      const geo = this.terrain.geoAtWorld(this.camera.position.x, this.camera.position.z);
      const ground = this.terrain.heightAtWorld(this.camera.position.x, this.camera.position.z) ?? 0;
      const clearance = this.camera.position.y - ground;
      this.hudCoordinates.textContent = formatLatLon(geo.latitude, geo.longitude);
      this.hudTerrain.textContent = ground < 0 ? `${formatKm(Math.abs(ground))} DI BAWAH LAUT` : `${formatKm(ground)} AMSL`;
      if (this.region.id === "mariana" && this.camera.position.y < 0) this.hudAltitude.textContent = `${formatKm(Math.abs(this.camera.position.y))} DEPTH`;
      else this.hudAltitude.textContent = `${formatKm(this.camera.position.y)} AMSL · ${formatKm(clearance)} AGL`;
      this.hudDistance.textContent = formatKm(this.terrain.distanceToFeature(this.camera.position.x, this.camera.position.z));
      this.hudSpeed.textContent = this.speed >= 1 ? `${this.speed.toFixed(2)} KM/S` : `${Math.round(this.speed * 1000)} M/S`;
      this.hudQuality.textContent = QUALITY_PROFILES[this.selectedQualityName].label;
      if (force) this.hudData.textContent = this.region.sourceLabel;
    }

    updateRegionUI() {
      const region = this.region;
      this.applyRegionLighting();
      this.hudLocation.textContent = region.name;
      this.hudCoordinates.textContent = formatLatLon(region.latitude, region.longitude);
      this.hudQuality.textContent = QUALITY_PROFILES[this.selectedQualityName].label;
      this.hudData.textContent = region.sourceLabel;
      this.infoName.textContent = region.feature;
      this.infoType.textContent = region.infoLabel || region.name;
      this.infoCoords.textContent = formatLatLon(region.latitude, region.longitude);
      this.infoDescription.textContent = region.definition || region.descriptor;
      this.infoFacts.replaceChildren(...region.educational.map(item => {
        const li = document.createElement("li");
        li.textContent = item;
        return li;
      }));
      const media = REGION_MEDIA[region.id];
      if (this.infoMedia && this.infoImage && this.infoImageCaption) {
        this.infoMedia.classList.remove("is-error");
        if (media) {
          this.infoMedia.hidden = false;
          this.infoImage.alt = media.alt;
          this.infoImageCaption.textContent = media.caption;
          this.infoImage.onerror = () => this.infoMedia.classList.add("is-error");
          this.infoImage.onload = () => this.infoMedia.classList.remove("is-error");
          this.infoImage.src = media.src;
        } else {
          this.infoMedia.hidden = true;
          this.infoImage.removeAttribute("src");
          this.infoImage.alt = "";
          this.infoImageCaption.textContent = "";
        }
      }
      this.infoSource.href = "https://www.mapzen.com/blog/terrain-tile-service/";
      this.infoSource.textContent = "Provenance terrain: Mapzen / Amazon Public Dataset ↗";
      this.root.dataset.region = region.id;
      this.updateSelectorCurrentRegion();
    }

    applyRegionLighting() {
      if (!this.scene || !this.renderer) return;
      const visual = REGION_VISUALS[this.region.id] || REGION_VISUALS.maunakea;
      this.scene.fog = new this.THREE.FogExp2(visual.fog, visual.fogDensity);
      this.renderer.toneMappingExposure = visual.exposure;
      this.renderer.setClearColor(visual.skyHorizon, 1);
      this.hemiLight.color.set(visual.hemiSky);
      this.hemiLight.groundColor.set(visual.hemiGround);
      this.hemiLight.intensity = this.region.id === "mariana" ? 0.48 : this.region.id === "antarctica" ? 0.92 : 0.82;
      this.sunLight.color.set(visual.sun);
      this.sunLight.intensity = visual.sunIntensity;
      if (this.region.id === "grandcanyon") this.sunLight.position.set(-52, 44, 28);
      else if (this.region.id === "everest") this.sunLight.position.set(-38, 78, 24);
      else this.sunLight.position.set(-45, 66, 35);
      this.fillLight.intensity = this.region.id === "mariana" ? 0.10 : 0.27;
    }

    discoveryStorageKey() {
      return `antara-earth-discoveries-v1:${this.region.id}`;
    }

    loadDiscoveryState() {
      this.discovered = new Set();
      try {
        const saved = JSON.parse(localStorage.getItem(this.discoveryStorageKey()) || "[]");
        if (Array.isArray(saved)) saved.forEach(id => this.discovered.add(id));
      } catch {}
    }

    saveDiscoveryState() {
      try { localStorage.setItem(this.discoveryStorageKey(), JSON.stringify([...this.discovered])); } catch {}
    }

    setupEducationUI() {
      this.loadDiscoveryState();
      this.activeObservation = null;
      this.nearbyObservation = null;
      this.observationPrompt.hidden = true;
      this.closeObservationCard(false);
      this.objectivesRegion.textContent = this.region.short;
      const education = EARTH_EDUCATION[this.region.id];
      this.objectivesIntro.textContent = education?.intro || "Jelajahi wilayah dan amati bentuk terrain di sekitarmu.";
      this.terrain?.createEducationalMarkers(education?.observations || []);
      this.renderObjectives();
      this.updateDiscoveryUI();
    }

    renderObjectives() {
      const observations = EARTH_EDUCATION[this.region.id]?.observations || [];
      this.objectivesList.replaceChildren(...observations.map((obs, index) => {
        const li = document.createElement("li");
        li.dataset.discovery = obs.id;
        if (this.discovered.has(obs.id)) li.classList.add("is-done");
        li.innerHTML = `<span>${this.discovered.has(obs.id) ? "✓" : String(index + 1).padStart(2,"0")}</span><div><strong>${obs.title}</strong><small>${this.discovered.has(obs.id) ? "SUDAH DIAMATI" : "BELUM DIAMATI"}</small></div>`;
        return li;
      }));
    }

    updateDiscoveryUI() {
      const observations = EARTH_EDUCATION[this.region.id]?.observations || [];
      const done = observations.filter(obs => this.discovered.has(obs.id)).length;
      const total = observations.length;
      this.discoveryCount.textContent = `${done} / ${total}`;
      this.discoveryBar.style.transform = `scaleX(${total ? done / total : 0})`;
      this.objectivesToggle.textContent = `Tujuan · ${done} / ${total}`;
      this.renderObjectives();
    }

    updateEducation(force = false) {
      if (this.state !== STATES.ACTIVE || !this.camera) return;
      const observations = EARTH_EDUCATION[this.region.id]?.observations || [];
      let nearest = null;
      let nearestDistance = Infinity;
      for (const obs of observations) {
        const distance = Math.hypot(this.camera.position.x - obs.x, this.camera.position.z - obs.z);
        if (!this.discovered.has(obs.id) && distance < nearestDistance) {
          nearest = obs;
          nearestDistance = distance;
        }
      }

      if (nearest) {
        this.nextTarget.hidden = false;
        this.nextTargetName.textContent = nearest.title;
        this.nextTargetDistance.textContent = formatKm(nearestDistance);
      } else {
        this.nextTarget.hidden = true;
      }

      const nearby = observations
        .map(obs => ({ obs, distance:Math.hypot(this.camera.position.x - obs.x, this.camera.position.z - obs.z) }))
        .filter(item => item.distance <= item.obs.radius)
        .sort((a,b) => a.distance - b.distance)[0];

      this.nearbyObservation = nearby?.obs || null;
      if (this.nearbyObservation && !this.isObservationCardOpen()) {
        this.observationPrompt.hidden = false;
        this.observationPromptTitle.textContent = this.nearbyObservation.title;
      } else {
        this.observationPrompt.hidden = true;
      }

      if (force) this.updateDiscoveryUI();
    }

    tryObserveNearby() {
      if (!this.nearbyObservation || this.state !== STATES.ACTIVE) return false;
      this.markDiscovery(this.nearbyObservation);
      this.openObservationCard(this.nearbyObservation);
      return true;
    }

    markDiscovery(observation) {
      if (!observation || this.discovered.has(observation.id)) return;
      this.discovered.add(observation.id);
      this.saveDiscoveryState();
      this.updateDiscoveryUI();
    }

    isObservationCardOpen() {
      return !this.observationCard.hidden && this.observationCard.getAttribute("aria-hidden") === "false";
    }

    openObservationCard(observation) {
      this.activeObservation = observation;
      this.input.reset();
      if (document.pointerLockElement === this.viewport) document.exitPointerLock?.();
      this.observationPrompt.hidden = true;
      this.observationType.textContent = observation.type || "TAHUKAH KAMU?";
      this.observationStatus.textContent = this.discovered.has(observation.id) ? "TEMUAN TERCATAT" : "BARU KAMU LIHAT";
      this.observationTitle.textContent = observation.title;
      this.observationMeta.textContent = `${this.region.name} · ${formatLatLon(this.region.latitude, this.region.longitude)}`;
      this.observationLead.textContent = observation.lead;
      this.observationWhy.textContent = observation.why;
      this.observationSections.replaceChildren(...(observation.sections || []).map(([heading, body]) => {
        const section = document.createElement("section");
        section.innerHTML = `<small>${heading}</small><p>${body}</p>`;
        return section;
      }));
      this.observationDeep.replaceChildren(...[
        `SUMBER MEDAN: ${this.region.sourceLabel}. Data ini dipakai untuk membentuk tinggi dan rendah terrain yang kamu jelajahi.`,
        "Tekstur, kabut, air, salju, dan pencahayaan membantu suasana serta keterbacaan. Bentuk topografi utamanya tetap mengikuti data elevasi atau bathymetry."
      ].map(item => {
        const p = document.createElement("p");
        p.textContent = item;
        return p;
      }));
      this.observationMore.open = false;
      this.observationSource.href = "https://www.mapzen.com/blog/terrain-tile-service/";
      this.observationCard.hidden = false;
      this.observationCard.setAttribute("aria-hidden", "false");
      this.root.classList.add("is-observation-open");
      requestAnimationFrame(() => this.observationClose.focus({ preventScroll:true }));
    }

    closeObservationCard(focus = false) {
      if (!this.observationCard) return;
      this.observationCard.hidden = true;
      this.observationCard.setAttribute("aria-hidden", "true");
      this.root.classList.remove("is-observation-open");
      this.activeObservation = null;
      if (focus) this.viewport.focus?.({ preventScroll:true });
      if (this.state === STATES.ACTIVE) this.updateEducation(true);
    }

    syncEducationPanels(focusTarget = null) {
      const active = this.state === STATES.ACTIVE;
      if (!active) {
        this.infoOpen = false;
        this.objectivesOpen = false;
      }

      this.infoCard.hidden = !this.infoOpen;
      this.infoCard.classList.toggle("is-visible", this.infoOpen);
      this.infoCard.setAttribute("aria-hidden", String(!this.infoOpen));
      this.root.classList.toggle("is-info-open", this.infoOpen);

      this.objectivesPanel.hidden = !this.objectivesOpen;
      this.root.classList.toggle("is-objectives-open", this.objectivesOpen);

      // The two compact buttons are independent switches. Opening one panel never
      // re-labels or reuses the other button, so their click targets cannot drift.
      this.infoToggle.hidden = !active || this.infoOpen;
      this.objectivesToggle.hidden = !active || this.objectivesOpen;

      if (focusTarget === "info-close" && this.infoOpen) this.infoMinimize?.focus({ preventScroll:true });
      else if (focusTarget === "info-toggle" && !this.infoToggle.hidden) this.infoToggle?.focus({ preventScroll:true });
      else if (focusTarget === "objectives-close" && this.objectivesOpen) this.objectivesCollapse?.focus({ preventScroll:true });
      else if (focusTarget === "objectives-toggle" && !this.objectivesToggle.hidden) this.objectivesToggle?.focus({ preventScroll:true });
    }

    expandObjectives(focus = false) {
      this.objectivesOpen = true;
      this.syncEducationPanels(focus ? "objectives-close" : null);
    }

    collapseObjectives(focus = false) {
      this.objectivesOpen = false;
      this.syncEducationPanels(focus ? "objectives-toggle" : null);
    }

    showRegionInfo(focus = false) {
      if (document.pointerLockElement === this.viewport) document.exitPointerLock?.();
      this.infoOpen = true;
      this.syncEducationPanels(focus ? "info-close" : null);
    }

    hideRegionInfo(focus = false) {
      this.infoOpen = false;
      this.syncEducationPanels(focus ? "info-toggle" : null);
    }

    showTutorial() {
      this.tutorial.hidden = false;
      this.tutorial.classList.remove("is-dismissed");
      clearTimeout(this.tutorialTimeout);
      this.tutorialTimeout = window.setTimeout(() => this.dismissTutorial(), this.isMobileUi() ? 6500 : 5200);
    }

    dismissTutorial(persist = false) {
      clearTimeout(this.tutorialTimeout);
      this.tutorial.classList.add("is-dismissed");
      window.setTimeout(() => {
        if (this.tutorial.classList.contains("is-dismissed")) this.tutorial.hidden = true;
      }, 280);
    }

    showBoundaryHint() {
      clearTimeout(this.boundaryTimeout);
      this.boundaryHint.textContent = "BATAS EKSPLORASI · medan tetap berlanjut secara visual di luar zona aktif";
      this.boundaryHint.classList.add("is-visible");
      this.boundaryTimeout = window.setTimeout(() => this.boundaryHint.classList.remove("is-visible"), 1300);
    }

    openSelectorFromRegion() {
      if (this.state !== STATES.ACTIVE || !this.terrain) return;
      this.selectorOpenedFromRegion = true;
      this.input.reset();
      this.state = STATES.SELECTING;
      this.selector.hidden = false;
      this.updateSelectorCurrentRegion();
      this.root.classList.add("is-selecting");
      this.closeObservationCard(false);
      this.hideRegionInfo(false);
      this.collapseObjectives(false);
      this.infoToggle.hidden = true;
      this.objectivesToggle.hidden = true;
      this.observationPrompt.hidden = true;
      document.getElementById("announcement").textContent = "Pilih wilayah Bumi lain untuk dijelajahi.";
      requestAnimationFrame(() => this.selector.querySelector(`[data-earth-region="${this.region.id}"]`)?.focus({ preventScroll:true }));
    }

    closeSelectorToRegion() {
      if (!this.terrain || this.state !== STATES.SELECTING) return;
      this.selector.hidden = true;
      this.selectorOpenedFromRegion = false;
      this.state = STATES.ACTIVE;
      this.root.classList.remove("is-selecting");
      this.infoOpen = false;
      this.objectivesOpen = !this.isMobileUi();
      this.syncEducationPanels();
      this.startLoop();
      this.updateResponsiveUi();
      this.updateEducation(true);
    }

    async exit() {
      if (!this.active || this.state === STATES.EXITING) return;
      if (this.state === STATES.CONFIGURING || (this.state === STATES.SELECTING && !this.terrain)) {
        this.cancelPreEntry();
        return;
      }
      if ([STATES.PREPARING, STATES.ERROR].includes(this.state)) {
        this.failBack();
        return;
      }

      this.state = STATES.EXITING;
      const token = ++this.transitionToken;
      this.input.reset();
      this.setActionsMenu(false);
      this.selector.hidden = true;
      this.qualityPanel.hidden = true;
      this.closeObservationCard(false);
      this.hideRegionInfo(false);
      this.collapseObjectives(false);
      this.infoToggle.hidden = true;
      this.objectivesToggle.hidden = true;
      this.observationPrompt.hidden = true;
      this.tutorial.classList.add("is-dismissed");
      this.boundaryHint.classList.remove("is-visible");
      this.root.classList.add("is-exiting");
      document.getElementById("announcement").textContent = "Meninggalkan permukaan Bumi dan kembali ke panorama orbit.";
      this.startLoop();

      if (this.terrain && this.camera) {
        const ground = this.terrain.heightAtWorld(this.camera.position.x, this.camera.position.z) ?? 0;
        const startY = this.camera.position.y;
        const targetY = Math.max(startY + 10, ground + 15);
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const duration = reduced ? 160 : 1550;
        const start = performance.now();
        await new Promise(resolve => {
          const frame = now => {
            if (token !== this.transitionToken) return resolve();
            const raw = clamp((now - start) / duration, 0, 1);
            this.camera.position.y = lerp(startY, targetY, smoothstep(raw));
            this.root.style.setProperty("--entry-progress", String(1 - smoothstep(raw)));
            if (raw < 1) requestAnimationFrame(frame);
            else resolve();
          };
          requestAnimationFrame(frame);
        });
      }
      if (token !== this.transitionToken) return;

      // Venus-style continuous handoff: reveal the real Earth sphere while the
      // surface renderer is still alive, then recede smoothly to panorama framing.
      this.earth.returnFromFullExplorationToSelector?.();
      this.earth.setFullExplorationTransition?.(1, this.region);
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = reduced ? 240 : 3000;
      const start = performance.now();
      await new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken) return resolve();
          const raw = clamp((now - start) / duration, 0, 1);
          const eased = smoothstep(raw);
          this.root.style.setProperty("--surface-opacity", String(1 - smoothstep(raw / 0.70)));
          this.root.style.opacity = String(1 - smoothstep(clamp((raw - 0.18) / 0.82, 0, 1)));
          this.earth.setFullExplorationTransition?.(1 - eased);
          if (raw < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
      if (token !== this.transitionToken) return;
      this.finishExit();
    }

    finishExit() {
      if (document.fullscreenElement === this.root) document.exitFullscreen().catch(() => {});
      this.state = STATES.IDLE;
      this.stopLoop();
      this.input.reset();
      if (document.pointerLockElement === this.viewport) document.exitPointerLock?.();
      this.disposeTerrain();
      this.disposeRenderer();

      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.root.className = "earth-full-exploration";
      this.root.style.removeProperty("--surface-opacity");
      this.root.style.removeProperty("--entry-progress");
      this.root.style.removeProperty("opacity");
      this.selector.hidden = false;
      this.qualityPanel.hidden = true;
      this.loading.hidden = true;
      this.errorPanel.hidden = true;
      this.selectorOpenedFromRegion = false;
      this.objectivesOpen = false;
      this.infoOpen = false;
      document.getElementById("mission").classList.remove("is-earth-full", "is-earth-full-selecting");
      this.earth.setFullExplorationTransition?.(0, this.region);
      this.earth.endFullExplorationFocus?.();
      this.entryButton.disabled = false;
      this.entryButton.focus({ preventScroll:true });
      document.getElementById("announcement").textContent = "Kembali ke panorama Bumi.";
    }

    showError(error) {
      console.warn("Earth Full Exploration:", error);
      this.stopLoop();
      this.state = STATES.ERROR;
      this.root.classList.add("is-error");
      this.loading.hidden = true;
      this.errorPanel.hidden = false;
      this.errorMessage.textContent = `${error?.message || "Data terrain real tidak dapat dimuat."} ANTARA tidak mengganti data yang gagal dengan terrain procedural.`;
      this.entryButton.disabled = false;
      document.getElementById("announcement").textContent = "Eksplorasi penuh Bumi gagal dimuat. Panorama Bumi tetap aman.";
    }

    failBack() {
      this.transitionToken += 1;
      this.stopLoop();
      this.input.reset();
      this.disposeTerrain();
      this.disposeRenderer();
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.root.className = "earth-full-exploration";
      this.root.style.removeProperty("--surface-opacity");
      this.root.style.removeProperty("--entry-progress");
      this.root.style.removeProperty("opacity");
      this.qualityPanel.hidden = true;
      this.selector.hidden = false;
      this.loading.hidden = true;
      this.errorPanel.hidden = true;
      document.getElementById("mission").classList.remove("is-earth-full", "is-earth-full-selecting");
      this.earth.endFullExplorationFocus?.();
      this.state = STATES.IDLE;
      this.entryButton.disabled = false;
    }

    disposeTerrain() {
      this.terrain?.dispose();
      this.terrain = null;
      this.provider?.clear();
      this.provider = null;
    }

    disposeRenderer() {
      if (!this.renderer) return;
      this.renderer.dispose();
      this.renderer.domElement?.remove();
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.hemiLight = null;
      this.sunLight = null;
      this.fillLight = null;
    }

    resize(recalculateDpr = true) {
      if (!this.renderer || !this.camera) return;
      const width = Math.max(1, this.viewport.clientWidth || innerWidth);
      const height = Math.max(1, this.viewport.clientHeight || innerHeight);
      if (recalculateDpr) {
        this.idealDpr = this.calculateDpr();
        this.currentDpr = Math.min(this.currentDpr || this.idealDpr, this.idealDpr);
        this.renderer.setPixelRatio(this.currentDpr);
      }
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.fov = this.mobileFov();
      this.camera.updateProjectionMatrix();
    }

    forceReset() {
      this.transitionToken += 1;
      this.stopLoop();
      this.input.reset();
      clearTimeout(this.tutorialTimeout);
      clearTimeout(this.boundaryTimeout);
      if (document.pointerLockElement === this.viewport) document.exitPointerLock?.();
      this.disposeTerrain();
      this.disposeRenderer();
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.root.className = "earth-full-exploration";
      this.root.style.removeProperty("--surface-opacity");
      this.root.style.removeProperty("--entry-progress");
      this.root.style.removeProperty("opacity");
      this.selector.hidden = false;
      this.qualityPanel.hidden = true;
      this.loading.hidden = true;
      this.errorPanel.hidden = true;
      document.getElementById("mission").classList.remove("is-earth-full", "is-earth-full-selecting");
      this.earth.endFullExplorationFocus?.();
      this.state = STATES.IDLE;
      this.entryButton.disabled = false;
    }

    async toggleFullscreen() {
      try {
        if (document.fullscreenElement === this.root) await document.exitFullscreen();
        else await this.root.requestFullscreen();
      } catch {}
    }

    updateFullscreenLabel() {
      const fullscreen = document.fullscreenElement === this.root;
      this.fullscreenButton.setAttribute("aria-pressed", String(fullscreen));
      this.fullscreenButton.querySelector("span").textContent = fullscreen ? "Keluar layar penuh" : "Layar penuh";
      if (this.renderer) window.setTimeout(() => this.resize(), 80);
    }
  };

})();
