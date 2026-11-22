// Kursinhalte. Spalten: [Deutsch, Spanisch, Italienisch, Kroatisch, Bosnisch, Türkisch]
// {L} im deutschen Text wird durch den Sprachnamen ersetzt.
window.LANGS = {
  es: { name: "Spanisch",    flag: "🇪🇸", col: 1, tts: ["es-ES", "es"],              stt: ["es-ES"] },
  it: { name: "Italienisch", flag: "🇮🇹", col: 2, tts: ["it-IT", "it"],              stt: ["it-IT"] },
  hr: { name: "Kroatisch",   flag: "🇭🇷", col: 3, tts: ["hr-HR", "hr", "sr", "bs"],  stt: ["hr-HR"] },
  bs: { name: "Bosnisch",    flag: "🇧🇦", col: 4, tts: ["bs-BA", "bs", "hr", "sr"],  stt: ["bs-BA", "hr-HR"] },
  tr: { name: "Türkisch",    flag: "🇹🇷", col: 5, tts: ["tr-TR", "tr"],              stt: ["tr-TR"] },
};

window.NUMBERS = {
  es: ["cero","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez"],
  it: ["zero","uno","due","tre","quattro","cinque","sei","sette","otto","nove","dieci"],
  hr: ["nula","jedan","dva","tri","četiri","pet","šest","sedam","osam","devet","deset"],
  bs: ["nula","jedan","dva","tri","četiri","pet","šest","sedam","osam","devet","deset"],
  tr: ["sıfır","bir","iki","üç","dört","beş","altı","yedi","sekiz","dokuz","on"],
};

window.CONTENT = [
  { title: "Begrüßung", icon: "👋", items: [
    ["Hallo", "Hola", "Ciao", "Bok", "Zdravo", "Merhaba"],
    ["Guten Morgen", "Buenos días", "Buongiorno", "Dobro jutro", "Dobro jutro", "Günaydın"],
    ["Guten Abend", "Buenas noches", "Buonasera", "Dobra večer", "Dobro veče", "İyi akşamlar"],
    ["Wie geht es dir?", "¿Cómo estás?", "Come stai?", "Kako si?", "Kako si?", "Nasılsın?"],
    ["Mir geht es gut, danke.", "Estoy bien, gracias.", "Sto bene, grazie.", "Dobro sam, hvala.", "Dobro sam, hvala.", "İyiyim, teşekkürler."],
    ["Und dir?", "¿Y tú?", "E tu?", "A ti?", "A ti?", "Ya sen?"],
    ["Vielen Dank!", "¡Muchas gracias!", "Grazie mille!", "Hvala lijepa!", "Hvala lijepa!", "Çok teşekkürler!"],
    ["Entschuldigung", "Perdón", "Scusi", "Oprostite", "Izvinite", "Affedersiniz"],
    ["Auf Wiedersehen", "Adiós", "Arrivederci", "Doviđenja", "Doviđenja", "Hoşça kalın"],
  ]},
  { title: "Sich vorstellen", icon: "🙋", items: [
    ["Ich heiße Anna.", "Me llamo Anna.", "Mi chiamo Anna.", "Zovem se Anna.", "Zovem se Anna.", "Benim adım Anna."],
    ["Wie heißt du?", "¿Cómo te llamas?", "Come ti chiami?", "Kako se zoveš?", "Kako se zoveš?", "Adın ne?"],
    ["Ich komme aus Deutschland.", "Soy de Alemania.", "Vengo dalla Germania.", "Ja sam iz Njemačke.", "Ja sam iz Njemačke.", "Almanya'dan geliyorum."],
    ["Woher kommst du?", "¿De dónde eres?", "Di dove sei?", "Odakle si?", "Odakle si?", "Nerelisin?"],
    ["Freut mich.", "Encantado.", "Piacere.", "Drago mi je.", "Drago mi je.", "Memnun oldum."],
    ["Ich spreche ein bisschen {L}.", "Hablo un poco de español.", "Parlo un po' d'italiano.", "Govorim malo hrvatski.", "Govorim malo bosanski.", "Biraz Türkçe konuşuyorum."],
    ["Ich verstehe nicht.", "No entiendo.", "Non capisco.", "Ne razumijem.", "Ne razumijem.", "Anlamıyorum."],
    ["Kannst du langsamer sprechen?", "¿Puedes hablar más despacio?", "Puoi parlare più lentamente?", "Možeš li govoriti sporije?", "Možeš li govoriti sporije?", "Daha yavaş konuşabilir misin?"],
  ]},
  { title: "Café & Restaurant", icon: "☕", items: [
    ["Einen Kaffee, bitte.", "Un café, por favor.", "Un caffè, per favore.", "Jednu kavu, molim.", "Jednu kafu, molim.", "Bir kahve, lütfen."],
    ["Ein Wasser, bitte.", "Un agua, por favor.", "Un'acqua, per favore.", "Jednu vodu, molim.", "Jednu vodu, molim.", "Bir su, lütfen."],
    ["Ein Tisch für zwei, bitte.", "Una mesa para dos, por favor.", "Un tavolo per due, per favore.", "Stol za dvoje, molim.", "Sto za dvoje, molim.", "İki kişilik bir masa, lütfen."],
    ["Können wir bestellen?", "¿Podemos pedir?", "Possiamo ordinare?", "Možemo li naručiti?", "Možemo li naručiti?", "Sipariş verebilir miyiz?"],
    ["Was empfehlen Sie?", "¿Qué me recomienda?", "Cosa mi consiglia?", "Što preporučujete?", "Šta preporučujete?", "Ne önerirsiniz?"],
    ["Das Brot", "El pan", "Il pane", "Kruh", "Hljeb", "Ekmek"],
    ["Das ist sehr lecker.", "Está muy rico.", "È buonissimo.", "Ovo je jako ukusno.", "Ovo je jako ukusno.", "Bu çok lezzetli."],
    ["Prost!", "¡Salud!", "Salute!", "Živjeli!", "Živjeli!", "Şerefe!"],
    ["Die Rechnung, bitte.", "La cuenta, por favor.", "Il conto, per favore.", "Račun, molim.", "Račun, molim.", "Hesap, lütfen."],
  ]},
  { title: "Zahlen & Einkaufen", icon: "🛒", items: [
    ["eins, zwei, drei", "uno, dos, tres", "uno, due, tre", "jedan, dva, tri", "jedan, dva, tri", "bir, iki, üç"],
    ["vier, fünf, sechs", "cuatro, cinco, seis", "quattro, cinque, sei", "četiri, pet, šest", "četiri, pet, šest", "dört, beş, altı"],
    ["sieben, acht, neun, zehn", "siete, ocho, nueve, diez", "sette, otto, nove, dieci", "sedam, osam, devet, deset", "sedam, osam, devet, deset", "yedi, sekiz, dokuz, on"],
    ["Wie viel kostet das?", "¿Cuánto cuesta esto?", "Quanto costa?", "Koliko ovo košta?", "Koliko ovo košta?", "Bu ne kadar?"],
    ["Das ist zu teuer.", "Es demasiado caro.", "È troppo caro.", "To je preskupo.", "To je preskupo.", "Bu çok pahalı."],
    ["Ich nehme das.", "Me lo llevo.", "Lo prendo.", "Uzet ću ovo.", "Uzet ću ovo.", "Bunu alıyorum."],
    ["Kann ich mit Karte zahlen?", "¿Puedo pagar con tarjeta?", "Posso pagare con la carta?", "Mogu li platiti karticom?", "Mogu li platiti karticom?", "Kartla ödeyebilir miyim?"],
    ["Haben Sie Brot?", "¿Tiene pan?", "Ha del pane?", "Imate li kruha?", "Imate li hljeba?", "Ekmek var mı?"],
  ]},
  { title: "Unterwegs", icon: "🧭", items: [
    ["Wo ist der Bahnhof?", "¿Dónde está la estación?", "Dov'è la stazione?", "Gdje je kolodvor?", "Gdje je stanica?", "Tren istasyonu nerede?"],
    ["Wo ist die Toilette?", "¿Dónde está el baño?", "Dov'è il bagno?", "Gdje je toalet?", "Gdje je toalet?", "Tuvalet nerede?"],
    ["links", "a la izquierda", "a sinistra", "lijevo", "lijevo", "sola"],
    ["rechts", "a la derecha", "a destra", "desno", "desno", "sağa"],
    ["Gehen Sie geradeaus.", "Siga todo recto.", "Vada sempre dritto.", "Idite ravno.", "Idite pravo.", "Düz gidin."],
    ["Ist es weit?", "¿Está lejos?", "È lontano?", "Je li daleko?", "Da li je daleko?", "Uzak mı?"],
    ["Ein Ticket, bitte.", "Un billete, por favor.", "Un biglietto, per favore.", "Jednu kartu, molim.", "Jednu kartu, molim.", "Bir bilet, lütfen."],
    ["Können Sie mir helfen?", "¿Puede ayudarme?", "Può aiutarmi?", "Možete li mi pomoći?", "Možete li mi pomoći?", "Bana yardım edebilir misiniz?"],
  ]},
  { title: "Alltag & Zeit", icon: "⏰", items: [
    ["heute", "hoy", "oggi", "danas", "danas", "bugün"],
    ["morgen", "mañana", "domani", "sutra", "sutra", "yarın"],
    ["gestern", "ayer", "ieri", "jučer", "jučer", "dün"],
    ["Wie spät ist es?", "¿Qué hora es?", "Che ore sono?", "Koliko je sati?", "Koliko je sati?", "Saat kaç?"],
    ["Ich habe keine Zeit.", "No tengo tiempo.", "Non ho tempo.", "Nemam vremena.", "Nemam vremena.", "Vaktim yok."],
    ["Ich arbeite viel.", "Trabajo mucho.", "Lavoro molto.", "Puno radim.", "Mnogo radim.", "Çok çalışıyorum."],
    ["Das Wetter ist schön.", "Hace buen tiempo.", "Fa bel tempo.", "Vrijeme je lijepo.", "Vrijeme je lijepo.", "Hava güzel."],
    ["Bis morgen!", "¡Hasta mañana!", "A domani!", "Vidimo se sutra!", "Vidimo se sutra!", "Yarın görüşürüz!"],
  ]},
];

// Szenarien für den KI-Gesprächspartner
window.SCENARIOS = [
  { id: "cafe",   icon: "☕", title: "Im Café",          role: "Kellner/in in einem Café, der/die die Bestellung aufnimmt" },
  { id: "meet",   icon: "🙋", title: "Kennenlernen",     role: "freundliche Person, die du gerade auf einer Feier kennenlernst" },
  { id: "market", icon: "🛒", title: "Auf dem Markt",    role: "Verkäufer/in an einem Obst- und Gemüsestand" },
  { id: "way",    icon: "🧭", title: "Nach dem Weg fragen", role: "Passant/in in der Altstadt, den/die man nach dem Weg fragt" },
  { id: "hotel",  icon: "🏨", title: "Hotel-Check-in",   role: "Rezeptionist/in in einem kleinen Hotel" },
  { id: "doctor", icon: "🩺", title: "Beim Arzt",        role: "Ärztin/Arzt in einer Hausarztpraxis" },
  { id: "free",   icon: "💬", title: "Freies Gespräch",  role: "neugierige/r Gesprächspartner/in für Smalltalk über Alltag, Hobbys und Arbeit" },
];
