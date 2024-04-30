//! farklı dosyalardan gelen veriler
import { setStorage, getStorage, icons, userIcon } from "./helpers.js";

//!  html elemanlarını çağırma
const form = document.querySelector("form");
const noteList = document.querySelector("ul");
const expandBtn = document.querySelector("#checkbox");
const aside = document.querySelector(".wrapper");
const input = document.querySelector("form #title");
const cancelBtn = document.querySelector("form #cancel");

//! global değişkenler(kodun her yerinden erişilebilen)
let coords;
let notes = getStorage() || []; //veriler olmasyınca null yerine boş dizi olsun
let markerLayer = [];
let map;

//* haritayı ekrana basan fonksiyon
function loadMap(coords) {
  map = L.map("map").setView(coords, 15);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // imleçleri tutacağımız ayrı bir katman oluşturma
  markerLayer = L.layerGroup().addTo(map);

  // kullanıcının konumuna imleç bas
  L.marker(coords, { icon: userIcon }).addTo(map);

  // lokalden gelen verileri ekrana bas
  renderNotesList(notes);

  // haritadaki tıklanma olaylarınız izle
  map.on("click", onMapClick);
}

//* kullanıcının konumunu almak
navigator.geolocation.getCurrentPosition(
  // konumu alırsa haritayı kullanıcının konumuna göre yükler
  (e) => {
    loadMap([e.coords.latitude, e.coords.longitude]);
  },
  // konumu almazsa varsayılan olarak ankarada başlar
  () => {
    loadMap([39.938112, 32.864626]);
  }
);

//* haritadaki tıklanma olaylarında çalışır
function onMapClick(event) {
  // tıklanan yerin konumuna eriştik ve global değişkene atardık
  coords = [event.latlng.lat, event.latlng.lng];

  // formu göster
  form.style.display = "flex";

  // ilk inputa odaklar
  form[0].focus();
}

//* iptal butonuna tıklanılırsa formu temizle ve kapat
form[3].addEventListener("click", () => {
  // formu temizle
  form.reset();

  // formu kapat
  form.style.display = "none";
});

//* form gönderilirse yeni bir not oluştur ve storege'a kaydet
form.addEventListener("submit", (e) => {
  //1) yenilemeyi engelle
  e.preventDefault();

  //2) inputlardaki verilerden bir note objesi oluştur
  const newNote = {
    id: new Date().getTime(),
    title: form[0].value,
    date: form[1].value,
    status: form[2].value,
    coords: coords,
  };
  //3) dizinin başına yeni notu ekle
  notes.unshift(newNote);

  //4) notları listele
  renderNotesList(notes);

  //5) logal storage'i güncelle
  setStorage(notes);

  //6) formu kapat
  form.style.display = "none";
  //7) formu temizler
  form.reset();
});

//* ekrana notları bas
function renderNotesList(items) {
  // önceden eklenen elemanları temizle
  noteList.innerHTML = "";
  markerLayer.clearLayers();
  // dizideki herbir obje için bit not kart bas
  items.forEach((note) => {
    const listEle = document.createElement("li");

    // data id ekle
    listEle.dataset.id = note.id;

    //  içeriği belirle
    listEle.innerHTML = `
            <div class="info">
              <p>${note.title}</p>
              <p>
                <span>Tarih:</span>
                <span>${note.date}</span>
              </p>
              <p>
                <span>Durum:</span>
                <span>${note.status}</span>
              </p>
            </div>
            <div class="icons">
              <i id="fly" class="bi bi-airplane-fill"></i>
              <i id="delete" class="bi bi-trash3-fill"></i>
            </div>`;

    // elemanı listeye ekle
    noteList.appendChild(listEle);

    // elemanı hariteye ekle
    renderMarker(note);
  });
}

//* not için imleç katmanına yeni bir imlaç ekle
function renderMarker(note) {
  // imleç oluştur
  L.marker(note.coords, { icon: icons[note.status] })
    //  imleci katmana ekle
    .addTo(markerLayer)
    .bindPopup(note.title);
}

//* silme ve uçuş
noteList.addEventListener("click", (e) => {
  // tıklanılan elemanın id'sine erişme
  const found_id = e.target.closest("li").dataset.id;
  if (
    e.target.id === "delete" &&
    confirm("Silmek istediğinizden emin misiniz?")
  ) {
    // id'sini bildiğimiz elmanı listeden çıkart
    notes = notes.filter((note) => note.id != found_id);

    //lokalı güncelle
    setStorage(notes);

    //ekranı güncelle
    renderNotesList(notes);
  }
  if (e.target.id === "fly") {
    // id'sini bildiğimiz elmanı dizideki haline erişme
    const note = notes.find((note) => note.id == found_id);

    // notun kordinatlarına git
    map.flyTo(note.coords, 15);

    // elemanın kordinatlarında geçici bir popup tanımlama
    var popup = L.popup().setLatLng(note.coords).setContent(note.title);

    // küçük ekranlarda uçurulduğunda menüyü kapat
    if (window.innerWidth < 769) {
      checkbox.checked = false;
      aside.classList.add("hide");
    }
    // popup'ı açma
    popup.openOn(map);
  }
});

//! Gizle / Göster
checkbox.addEventListener("input", (e) => {
  const isChecked = e.target.checked;

  if (isChecked) {
    aside.classList.remove("hide");
  } else {
    aside.classList.add("hide");
  }
});
