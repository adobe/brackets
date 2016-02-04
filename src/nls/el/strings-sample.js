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
    TITLE: "ΞΕΚΙΝΩΝΤΑΣ ΜΕ ΤΟ BRACKETS",
    DESCRIPTION: "An interactive getting started guide for Brackets.",

    // BODY
    GETTING_STARTED: "ΞΕΚΙΝΩΝΤΑΣ ΜΕ ΤΟ BRACKETS",
    GETTING_STARTED_GUIDE: "Αυτός είναι ο οδηγός σας!",

    // MADE WITH <3 AND JAVASCRIPT
    WELCOME_COMMENT: "MADE WITH <3 AND JAVASCRIPT",
    WELCOME:
        "Καλώς ήρθατε σε μια πρώιμη προεπισκόπηση του Brackets, ένας νέος επεξεργαστής κειμένου ανοιχτού-κώδικα για τη νέα γενιά του\n" +
        "διαδικτύου. Είμαστε μεγάλοι οπαδοί των προτύπων και θέλουμε να φτιάξουμε καλύτερα εργαλεία για JavaScript, HTML και CSS\n" +
        "και σχετικές ανοιχτές τεχνολογίες του διαδικτύου. Αυτό είναι το ταπεινό μας ξεκίνημα.",

    // WHAT IS BRACKETS?
    EDITOR_COMMENT: "WHAT IS BRACKETS?",
    EDITOR: "Το Brackets είναι ένας διαφορετικής μορφής επεξεργαστής κειμένου.",
    EDITOR_DESCRIPTION:
        "Μία αξιοσημείωτη διαφορά είναι ότι αυτός ο επεξεργαστής κειμένου είναι γραμμένος σε JavaScript, HTML και CSS.\n" +
        "Αυτό σημαίνει ότι οι περισσότεροι από εσάς που χρησιμοποιούν το Brackets έχουν τις ικανότητες να τροποποιήσουν και να επεκτείνουν τον επεξεργαστή κειμένου.\n" +
        "Στην πραγματικότητα, χρησιμοποιούμε το Brackets κάθε μέρα για να φτιάξουμε το Brackets. Επίσης, έχει και κάποιες μοναδικές λειτουργίες όπως η Γρήγορα Επεξεργασία,\n" +
        "το Live Preview και άλλες που μπορεί να μην βρείτε σε άλλους επεξεργαστές.\n" +
        "Για να μάθετε περισσότερα για το πως να χρησιμοποιήσετε αυτές τις λειτουργίες, συνεχίστε το διάβασμα.",

    // GET STARTED WITH YOUR OWN FILES
    PROJECTS_COMMENT: "GET STARTED WITH YOUR OWN FILES",
    PROJECTS: "Projects in Brackets",
    PROJECTS_DESCRIPTION:
        "In order to edit your own code using Brackets, you can just open the folder containing your files.\n" +
        "Brackets treats the currently open folder as a \"project\"; features like Code Hints, Live Preview and\n" +
        "Quick Edit only use files within the currently open folder.",
    PROJECTS_SAMP:
        "Once you're ready to get out of this sample project and edit your own code, you can use the dropdown\n" +
        "in the left sidebar to switch folders. Right now, the dropdown says \"Getting Started\" - that's the\n" +
        "folder containing the file you're looking at right now. Click on the dropdown and choose \"Open Folder…\"\n" +
        "to open your own folder.\n" +
        "You can also use the dropdown later to switch back to folders you've opened previously, including this\n" +
        "sample project.",

    // THE RELATIONSHIP BETWEEN HTML, CSS AND JAVASCRIPT
    QUICK_EDIT_COMMENT: "THE RELATIONSHIP BETWEEN HTML, CSS AND JAVASCRIPT",
    QUICK_EDIT: "Γρήγορη Επεξεργασία για CSS και JavaScript",
    QUICK_EDIT_DESCRIPTION:
        "Όχι πια εναλλαγή μεταξύ των αρχείων και απόσπαση της προσοχής. Όταν επεξεργάζεστε HTML, χρησιμοποιήστε\n" +
        "την συντόμευση <kbd>Cmd/Ctrl + E</kbd> για να ανοίξετε έναν γρήγορο ενσωματωμένο επεξεργαστή που εμφανίζει το σχετικό CSS κώδικα.\n" +
        "Κάντε την αλλαγή στον κώδικα CSS, πατήστε <kbd>ESC</kbd> και είστε πίσω στην επεξεργασία HTML, ή απλά αφήστε τους\n" +
        "CSS κανόνες ανοιχτούς και αυτοί θα γίνουν μέρος του επεξεργαστή HTML. Αν πατήσεις <kbd>ESC</kbd> έξω από\n" +
        "έναν γρήγορο ενσωματωμένο επεξεργαστή, θα κρυφτούν όλα.",
    QUICK_EDIT_SAMP:
        "Θέλετε να το δείτε στην πράξη; Βάλε τον κέρσορα στο <!-- <samp> --> tag από πάνω και πάτησε\n" +
        "<kbd>Cmd/Ctrl + E</kbd>. Πρέπει να δεις ένα γρήγορο ενσωματωμένο επεξεργαστή να εμφανίζετε από πάνω, που δείχνει τον κανόνα CSS\n" +
        "που σχετίζετε με αυτό το tag. Η Γρήγορη Επεξεργασία λειτουργεί επίσης και για class και id ιδιότητες.\n" +
        "\n" +
        "Μπορείτε να δημιουργήσετε και νέους κανόνες με τον ίδιο τρόπο. Κάντε κλικ σε ένα από τα tags <!-- <p> --> από πάνω και πατήστε\n" +
        "<kbd>Cmd/Ctrl + E</kbd>. Δεν υπάρχουν κανόνες για αυτό προς το παρόν, αλλά μπορείτε να πατήσετε το κουμπί Νέου Κανόνα\n" +
        "για να εισάγετε έναν νέο κανόνα για το <!-- <p> -->.",
    QUICK_EDIT_SCREENSHOT: "A screenshot showing CSS Quick Edit",
    QUICK_EDIT_OTHERS:
        "Μπορείς να χρησιμοποιήσεις την ίδια συντόμευση για κώδικα JavaScript για να δεις το σώμα μιας συνάρτησης με\n" +
        "το να τοποθετείς τον κέρσορα στο όνομα της συνάρτησης που καλείτε.",
    QUICK_EDIT_NOTE:
        "Για τώρα οι γρήγοροι ενσωματωμένοι επεξεργαστές δεν μπορούν\n" +
        "να γίνουν ένθετοι, άρα μπορείς να χρησιμοποιήσεις την Γρήγορη Επεξεργασία μόνο όταν ο κέρσορας είναι μέσα σε έναν «πλήρους μεγέθους» επεξεργαστή.",

    // LIVE PREVIEW
    LIVE_PREVIEW_COMMENT: "LIVE PREVIEW",
    LIVE_PREVIEW: "Προεπισκόπηση αλλαγών HTML και CSS ζωντανά στον browser",
    LIVE_PREVIEW_INTRO:
        "Ξέρεις αυτό το «χορό save/reload» που κάνουμε τόσα χρόνια; Αυτό που κάνεις αλλαγές στον\n" +
        "επεξεργαστή σου, πατάς αποθήκευση, γυρνάς στον browser και μετά κάνεις ανανέωση για να δεις επιτέλους το αποτέλεσμα;\n" +
        "Με το Brackets, δεν χρειάζεται να κάνεις αυτόν τον χορό.",
    LIVE_PREVIEW_DESCRIPTION:
        "Το Brackets θα ανοίξει μία <em>ζωντανή σύνδεση</em> στον τοπικό σου browser και θα στείλει τους ανανεωμένους κώδικες HTML και CSS καθώς εσύ\n" +
        "πληκτρολογείς! Μπορεί ήδη να κάνεις κάτι τέτοιο με εργαλεία που βασίζονται στον browser, αλλά με το Brackets\n" +
        "δεν υπάρχει ανάγκη να αντιγράφεις και να επικολλάς τον τελικό κώδικα πίσω στον επεξεργαστή. Ο κώδικας σου τρέχει στον\n" +
        "browser, αλλά ζει στον επεξεργαστή σου!",
    LIVE_PREVIEW_HIGHLIGHT: "Ζωντανή επισήμανση στοιχείων HTML και κανόνων CSS",
    LIVE_PREVIEW_HIGHLIGHT_DESCRIPTION:
        "Το Brackets κάνει εύκολο το να βλέπεις πως οι αλλαγές στους κώδικες HTML και CSS θα επηρεάσουν την σελίδα. Όταν ο κέρσορας\n" +
        "είναι σε έναν κανόνα CSS, το Brackets θα επισημάνει όλα τα στοιχεία στον browser που επηρεάζονται. Παρόμοια, όταν επεξεργάζεστε\n" +
        "ένα αρχείο HTML, το Brackets θα επισημάνει τα αντιστοιχούμενα στοιχεία HTML στον browser.",
    LIVE_PREVIEW_HIGHLIGHT_SAMP:
        "Αν έχεις εγκατεστημένο τον Google Chrome, μπορείς να το δοκιμάσεις μόνο σου. Κάνε κλικ στο εικονίδιο της αστραπής\n" +
        "στην πάνω δεξιά γωνία του παραθύρου του Brackets ή πατήστε <kbd>Cmd/Ctrl + Alt + P</kbd>. Όταν\n" +
        "το Live Preview ενεργοποιηθεί σε ένα έγγραφο HTML, όλα τα συνδεόμενα αρχεία CSS μπορούν να επεξεργασθούν σε πραγματικό χρόνο.\n" +
        "Το εικονίδιο θα αλλάξει από γκρι σε χρυσό όταν το Brackets δημιουργήσει την σύνδεση με τον browser.\n" +
        "\n" +
        "Τώρα, τοποθέτησε τον κέρσορα του στο από πάνω <!-- <img> --> tag. Παρατηρήστε την μπλε επισήμανση που εμφανίζετε\n" +
        "γύρω από την εικόνα στον Chrome. Έπειτα, χρησιμοποιήστε το <kbd>Cmd/Ctrl + E</kbd> για να ανοίξετε τους ορισμένους κανόνες CSS.\n" +
        "Δοκιμάστε να αλλάξετε το μέγεθος του πλαισίου από 1px σε 10px ή αλλάξτε το χρώμα του φόντου\n" +
        "από \"dimgray\" σε \"hotpink\". Αν έχετε το Brackets και τον browser σας να είναι δίπλα δίπλα, θα δείτε\n" +
        "τις αλλαγές να συμβαίνουν στιγμιαία στον. Αμάτο, έτσι;",
    LIVE_PREVIEW_NOTE:
        "Σήμερα, το Brackets υποστηρίζει το Live Preview μόνο για HTML και CSS. Όμως, στην τρέχουσα έκδοση, οι αλλαγές\n" +
        "σε αρχεία JavaScript ανανεώνονται αυτόματα όταν κάνετε αποθήκευση. Προς το παρόν δουλεύουμε τη υποστήριξη του Live Preview\n" +
        "για JavaScript. Επίσης, οι άμεσες προεπισκοπήσεις του Live Preview είναι δυνατές μόνο με τον Google Chrome, αλλά ελπίζουμε\n" +
        "να φέρουμε αυτήν την λειτουργία σε όλους τους μεγάλους browser στο μέλλον.",

    // QUICK VIEW
    QUICK_VIEW: "Γρήγορη Προβολή",
    QUICK_VIEW_DESCRIPTION:
        "Για όσους από εμάς δεν απομνημονεύσει ακόμα τις αντιστοιχίες χρωμάτων για τις τιμές HEX ή RGB, το Brackets κάνει\n" +
        "γρήγορο και εύκολο το να βλέπεις ακριβώς ποιο χρώμα χρησιμοποιείται. Είτε σε CSS είτε σε HTML, απλά περάστε το ποντίκι πάνω από\n" +
        "τα τιμές του χρώματος ή τις διαβαθμίσεις χρώματος και το Brackets θα εμφανίσει μια προβολή αυτού του χρώματος ή της διαβάθμισης αυτόματα. Το\n" +
        "ίδιο συμβαίνει και με τις εικόνες: απλά περάστε πάνω από τον σύνδεσμο της εικόνας στο Brackets και αυτό θα προβάλει μια\n" +
        "μικρογραφία αυτής της εικόνας.",
    QUICK_VIEW_SAMP:
        "Για να δοκιμάσετε την Γρήγορη Προβολή από μόνος σας, βάλτε τον κέρσορα πάνω από το tag <!-- <body> --> στην κορυφή αυτού του\n" +
        "αρχείου και πατήστε <kbd>Cmd/Ctrl + E</kbd> για να ανοίξετε έναν γρήγορο επεξεργαστή CSS. Τώρα απλά πηγαίνετε το βελάκι πάνω από οποιοδήποτε\n" +
        "τιμή χρώματος μέσα στο αρχείο CSS. Επίσης, μπορείτε να το δείτε στη πράξη σε διαβαθμίσεις χρώματος με το ανοίξετε έναν γρήγορο επεξεργαστή CSS\n" +
        "στο tag <!-- <html> --> και πηγαίνοντας το βελάκι πάνω από οποιαδήποτε τιμή χρώματος του φόντου. Για να χρησιμοποιήσετε την προβολή\n" +
        "εικόνας, βάλτε τον κέρσορα πάνω από το screenshot που συμπεριλήφθηκε προηγουμένως σε αυτό το έγγραφο.",

    // EXTENSIONS
    EXTENSIONS: "Χρειάζεστε κάτι άλλο; Δοκιμάστε μία επέκταση!",
    EXTENSIONS_DESCRIPTION:
        "Εκτός από όλα τα καλά που έχει το Brackets, η μεγάλη και αυξανόμενη κοινότητα των\n" +
        "developers επεκτάσεων έχει φτιάξει πάνω από εκατό επεκτάσεις που προσθέτουν χρήσιμες λειτουργίες. Αν υπάρχει\n" +
        "κάτι που χρειάζεστε και το Brackets δεν το προσφέρει, είναι πολύ πιθανό κάποιος να έχει φτιάξει μία επέκταση\n" +
        "για αυτό. Για να περιηγηθήτε ή να ψάξετε τη λίστα των διαθέσιμων επεκτάσεων, πηγαίντε <strong>Αρχείο > Διαχειρηστής\n" +
        "Επεκτάσεων</strong> και κάντε κλικ στην καρτέλα «Διαθέσιμες». Όταν βρείτε μια επέκταση που θέλετε, απλά κάντε κλικ\n" +
        "στο κουμπί της εγκτάστασης δίπλα του.",

    // LET US KNOW WHAT YOU THINK
    GET_INVOLVED_COMMENT: "LET US KNOW WHAT YOU THINK",
    GET_INVOLVED: "Συμμετάσχετε",
    GET_INVOLVED_DESCRIPTION:
        "Το Brackets είναι ένα project ανοιχτού κώδικα. Web developers από όλον τον κόσμο συνεισφέρουν για να φτιάξουν\n" +
        "έναν καλύτερο επεξεργαστή κώδικα. Πολλοί περισσότεροι φτιάχνουν επεκτάσεις που επεκτείνουν τις δυνατότητες του Brackets.\n" +
        "Πείτε μας τι πιστεύετε, μοιραστείτε τις ιδέες σας ή συνεισφέρετε άμεσα στο\n" +
        "project.",

    URLNAME_BRACKETS: "Brackets.io",
    URLNAME_BRACKETS_BLOG: "Brackets Team Blog",
    URLNAME_BRACKETS_GITHUB: "Brackets στο GitHub",
    URLNAME_BRACKETS_EXTENSIONS_REGISTRY: "Επεκτάσεις Brackets",
    URLNAME_BRACKETS_WIKI: "Brackets Wiki",
    URLNAME_BRACKETS_MAILING_LIST: "Brackets Developer Mailing List",
    URLNAME_BRACKETS_TWITTER: "@Brackets στο Twitter",
    BRACKETS_CHAT_INFO_BEFORE: "Συνομιλήστε με τους προγραμματιστές του Brackets στο IRC κανάλι",
    BRACKETS_CHAT_FREENODE: "#brackets στο Freenode",
    BRACKETS_CHAT_INFO_AFTER: "(κυρίως στα Αγγλικά)"
});
