/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define({
    // HEAD
    TITLE: "MEMULAI DENGAN BRACKETS",
    DESCRIPTION: "An interactive getting started guide for Brackets.",

    // BODY
    GETTING_STARTED: "MEMULAI DENGAN BRACKETS",
    GETTING_STARTED_GUIDE: "Inilah panduan Anda!",

    // MADE WITH <3 AND JAVASCRIPT
    WELCOME_COMMENT: "DIBUAT DENGAN <3 DAN JAVASCRIPT",
    WELCOME:
        "Selamat datang di Brackets, sebuah editor modern dan open-source yang dirancang untuk mendesain web.\n" +
        "Ringan namun bertenaga, editor ini memadukan perangkat visual ke dalamnya sehingga Anda memiliki\n" +
        "perangkat yang tepat ketika Anda membutuhkannya.",

    // WHAT IS BRACKETS?
    EDITOR_COMMENT: "APA ITU BRACKETS?",
    EDITOR: "Brackets berbeda dari editor lainnya.",
    EDITOR_DESCRIPTION:
        "Brackets memiliki fitur-fitur yang unik seperti Edit Cepat, Tinjauan Langsung dan berbagai macam fitur\n" +
        "yang mungkin tidak Anda temui di editor lain. Brackets dikembangkan dengan JavaScript, HTML and CSS.\n" +
        "Ini berarti Anda, para pengguna Brackets sudah memiliki kemampuan untuk memodifikasi dan memperluas editor\n" +
        "ini. Bahkan, kami menggunakan Brackets setiap hari dalam pengembangan Brackets. Untuk mempelajari cara\n" +
        "penggunaan fitur-fitur utama yang ada di dalam Brackets, baca lebih lanjut.",

    // GET STARTED WITH YOUR OWN FILES
    PROJECTS_COMMENT: "MEMULAI DENGAN PEKERJAAN ANDA SENDIRI",
    PROJECTS: "Proyek di dalam Brackets",
    PROJECTS_DESCRIPTION:
        "Untuk mengedit kode Anda sendiri dengan menggunakan Brackets, Anda bisa langsung membuka folder yang\n" +
        "berisi file-file Anda. Brackets memperlakukan folder yang sedang dibuka sebagai \"proyek\"; fitur-fitur\n" +
        "seperti Petunjuk Kode, Tinjauan Langsung and Edit Cepat hanya menggunakan file-file yang ada di dalam\n" +
        "folder yang sedang dibuka.",
    PROJECTS_SAMP:
        "Saat Anda siap untuk keluar dari proyek contoh ini dan mengedit kode Anda sendiri, Anda dapat menggunakan\n" +
        "dropdown yang ada di sisi kiri sidebar untuk mengganti folder. Saat ini, dropdown Anda menunjukkan\n" +
        "\"Memulai\"- itu adalah folder yang berisi file yang Anda lihat saat ini. Klik pada dropdown dan\n" +
        "pilih \"Buka Folder…\" untuk membuka folder Anda sendiri.\n" +
        "Anda juga bisa menggunakan dropdown nanti untuk berpindah ke folder yang telah Anda buka sebelumnya,\n" +
        "termasuk proyek contoh ini.",

    // THE RELATIONSHIP BETWEEN HTML, CSS AND JAVASCRIPT
    QUICK_EDIT_COMMENT: "HTML, CSS DAN JAVASCRIPT SALING BERHUBUNGAN",
    QUICK_EDIT: "Edit Cepat untuk CSS dan JavaScript",
    QUICK_EDIT_DESCRIPTION:
        "Tidak perlu lagi repot-repot berpindah dari satu dokumen ke dokumen lainnya. Ketika mengedit HTML,\n" +
        "gunakan pintasan <kbd>Cmd/Ctrl + E</kbd> untuk membuka Edit Cepat yang menampilkan semua CSS yang sesuai.\n" +
        "Ubah CSS Anda, kemudian tekan <kbd>ESC</kbd> dan Anda kembali lagi mengedit HTML, atau tetap buka CSS Anda\n" +
        "dan kotak tersebut akan menjadi satu dengan editor Anda. Jika Anda menekan <kbd>ESC</kbd> diluar kotak Edit\n" +
        "Cepat, semuanya akan langsung disembunyikan. Edit Cepat juga akan menemukan aturan dalam file LESS dan\n" +
        "SCSS, termasuk aturan bersarang.",
    QUICK_EDIT_SAMP:
        "Mau lihat cara kerjanya? Tempatkan kursor Anda di tag <!-- <samp> --> di atas kemudian tekan\n" +
        "<kbd>Cmd/Ctrl + E</kbd>. Anda akan melihat editor cepat CSS muncul, menunjukkan aturan CSS yang sesuai.\n" +
        "Edit Cepat juga dapat digunakan untuk atribut class dan id. Anda juga bisa menggunakannya dengan file LESS\n" +
        "dan SCSS.\n" +
        "\n" +
        "Anda bisa membuat aturan baru dengan cara yang sama. Klik salah satu tag <!-- <p> -->\n" +
        "di atas dan tekan <kbd>Cmd/Ctrl + E</kbd>. Saat ini tidak ada aturan untuk tag itu, namun\n" +
        "Anda bisa klik tombol Aturan Baru untuk menambahkan aturan untuk <!-- <p> -->.",
    QUICK_EDIT_SCREENSHOT: "Screenshot menunjukkan Edit Cepat CSS",
    QUICK_EDIT_OTHERS:
        "Anda juga bisa menggunakan pintasan yang sama untuk mengedit hal-hal lainnya - seperti fungsi di\n" +
        "JavaScript, warna, dan fungsi animasi - dan kami terus menambahkan fitur lain setiap saat.",
    QUICK_EDIT_NOTE:
        "Saat ini, editor inline tidak dapat disarangkan, sehingga Anda hanya dapat menggunakan Edit Cepat ketika\n" +
        "berada dalam mode \"ukuran penuh\".",

    // LIVE PREVIEW
    LIVE_PREVIEW_COMMENT: "PREVIEW LANGSUNG",
    LIVE_PREVIEW: "Tinjau perubahan HTML dan CSS secara langsung di peramban",
    LIVE_PREVIEW_INTRO:
        "Anda tahu mengenai teknik \"simpan/muat ulang\" yang sering kita lakukan? Dimana kita mengubah file,\n" +
        "kemudian kita simpan, lalu pindah ke peramban dan memuat ulang halaman untuk melihat hasilnya? Dengan\n" +
        "Brackets, Anda tidak perlu melakukannya lagi.",
    LIVE_PREVIEW_DESCRIPTION:
        "Brackets akan membuka <em>sambungan langsung</em> ke peramban Anda dan memperbarui HTML dan CSS secara\n" +
        "langsung, bahkan ketika Anda mengetik! Mungkin Anda sudah pernah melakukan hal ini dengan perangkat dari\n" +
        "peramban, namun dengan Brackets, Anda tidak perlu lagi menyalin kode kembali ke editor. Kode Anda berjalan\n" +
        "di peramban, namun tetap berada di editor Anda!",
    LIVE_PREVIEW_HIGHLIGHT: "Soroti langsung elemen HTML dan aturan CSS",
    LIVE_PREVIEW_HIGHLIGHT_DESCRIPTION:
        "Brackets mempermudah Anda melihat bagaimana perubahan pada HTML dan CSS yang Anda buat akan mempengaruhi\n" +
        "halaman. Ketika kursor Anda berada pada aturan CSS, Brackets akan menyoroti semua elemen yang dipengaruhi\n" +
        "pada peramban. Hal yang sama ketika mengedit file HTML, Brackets akan menyoroti elemen HTML yang sesuai\n" +
        "pada peramban.",
    LIVE_PREVIEW_HIGHLIGHT_SAMP:
        "Jika Anda menggunakan Google Chrome, Anda bisa mencoba ini sendiri. Klik pada ikon petir di\n" +
        "sebelah kanan atas pada jendela Brackets Anda atau tekan <kbd>Cmd/Ctrl + Alt + P</kbd>.\n" +
        "Ketika Tinjauan Langsung dijalankan di dokumen HTML, semua dokumen CSS yang terhubung bisa diedit secara\n" +
        "langsung. Ikon petir akan berubah warna dari abu-abu menjadi emas ketika Brackets mendapatkan sambungan\n" +
        "ke peramban Anda.\n" +
        "\n" +
        "Sekarang, tempatkan kursor Anda di tag <!-- <img> --> di atas. Perhatikan sorotan warna biru yang muncul\n" +
        "di sekeliling gambar pada Chrome. Lalu, tekan <kbd>Cmd/Ctrl + E</kbd> untuk membuka aturan CSS yang ada.\n" +
        "Cobalah ubah ukuran border dari 10px ke 20px atau ubah warna background dari \"transparent\" ke \"hotpink\".\n" +
        "Jika Brackets dan peramban berjalan berdampingan, Anda akan dapat melihat perubahannya secara langsung\n" +
        "di peramban Anda. Keren, kan?",
    LIVE_PREVIEW_NOTE:
        "Saat ini, Brackets hanya mendukung Tinjauan Langsung untuk HTML dan CSS. Namun di versi ini, perubahan\n" +
        "terhadap JavaScript akan dimuat ulang ketika Anda menyimpan. Saat ini kami berusaha menambahkan\n" +
        "dukungan Tinjauan Langsung untuk JavaScript. Tinjauan Langsung juga hanya bisa dijalankan di peramban\n" +
        "Google Chrome, namun kami berharap untuk memberikan fitur ini ke semua peramban di masa depan.",

    // QUICK VIEW
    QUICK_VIEW: "Tampilan Cepat",
    QUICK_VIEW_DESCRIPTION:
        "Bagi Anda yang belum hafal nilai RGB dan HEX sebuah warna, dengan Brackets, Anda dapat dengan mudah dan\n" +
        "cepat untuk melihat warna apa saja yang sedang digunakan. Di CSS atau HTML, tempatkan kursor di atas nilai\n" +
        "warna atau gradien dan Brackets akan menampilkan warna/gradien tersebut secara otomatis. Sama halnya dengan\n" +
        "gambar: taruh kursor di atas link gambar pada editor Brackets dan menampilkan thumbnail dari gambar tersebut.",
    QUICK_VIEW_SAMP:
        "Untuk mencobanya sendiri, tempatkan kursor Anda pada tag <!-- <body> --> di atas dokumen ini dan tekan\n" +
        "<kbd>Cmd/Ctrl + E</kbd> untuk membuka editor cepat CSS. Setelah itu, tempatkan kursor di atas nilai warna\n" +
        "apapun di dalam CSS tersebut. Anda juga bisa mencoba sendiri untuk gradien dengan membuka editor cepat\n" +
        "CSS pada tag <!-- <html> --> dan menempatkan kursor pada nilai <i>background image</i> manapun. Untuk\n" +
        "mencoba tinjauan gambar, tempatkan kursor Anda di atas gambar screenshot yang ada di dokumen ini.",

    // EXTENSIONS
    EXTENSIONS: "Ingin fitur lain? Tambahkan ekstensi!",
    EXTENSIONS_DESCRIPTION:
        "Selain semua fitur-fitur keren yang ada di dalam Brackets, kami mempunyai komunitas pengembang ekstensi\n" +
        "yang terus tumbuh jumlahnya dan sudah membuat ratusan ekstensi yang sangat berguna. Apabila Anda\n" +
        "membutuhkan fitur yang tidak ada dalam Brackets, kemungkinan besar seseorang telah membuat ekstensi untuk\n" +
        "itu. Untuk melihat daftar ekstensi yang tersedia, klik <strong>File > Pengelola Ekstensi</strong> lalu\n" +
        "klik di tab \"Tersedia\". Ketika Anda menemukan ekstensi yang Anda inginkan, klik tombol \"Instal\" di sebelahnya.",

    // LET US KNOW WHAT YOU THINK
    GET_INVOLVED_COMMENT: "KAMI INGIN DENGAR PENDAPAT ANDA",
    GET_INVOLVED: "Ikut terlibat",
    GET_INVOLVED_DESCRIPTION:
        "Brackets adalah proyek open-source. Pengembang web dari seluruh dunia berkontribusi untuk membangun editor\n" +
        "yang lebih baik. Dan juga ada banyak orang yang menembangkan ekstensi untuk meningkatkan kemampuan Brackets.\n" +
        "Beri kami saran, ide, atau berkontribusilah secara langsung untuk Brackets.",

    URLNAME_BRACKETS: "Brackets.io",
    URLNAME_BRACKETS_BLOG: "Blog Tim Brackets",
    URLNAME_BRACKETS_GITHUB: "Brackets di GitHub",
    URLNAME_BRACKETS_EXTENSIONS_REGISTRY: "Daftar Ekstensi Brackets",
    URLNAME_BRACKETS_WIKI: "Wiki Brackets",
    URLNAME_BRACKETS_MAILING_LIST: "Milis Pengembang Brackets",
    URLNAME_BRACKETS_TWITTER: "@brackets di Twitter",
    BRACKETS_CHAT_INFO_BEFORE: "Mengobrol dengan pengembang Brackets di IRC dalam",
    BRACKETS_CHAT_FREENODE: "channel #brackets di Freenode",
    BRACKETS_CHAT_INFO_AFTER: ""
});

// Last translated for 3066a8c164995790b58a9ea739e9a5450edcc963
