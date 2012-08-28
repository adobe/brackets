/* Icelandic initialisation for the jQuery UI date picker plugin. */
/* Written by Haukur H. Thorsson (haukur@eskill.is). */
jQuery(function($){
	$.datepicker.regional['is'] = {
		closeText: 'Loka',
		prevText: '&#x3C; Fyrri',
		nextText: 'N&#xE6;sti &#x3E;',
		currentText: '&#xCD; dag',
		monthNames: ['Jan&#xFA;ar','Febr&#xFA;ar','Mars','Apr&#xED;l','Ma&iacute','J&#xFA;n&#xED;',
		'J&#xFA;l&#xED;','&#xC1;g&#xFA;st','September','Okt&#xF3;ber','N&#xF3;vember','Desember'],
		monthNamesShort: ['Jan','Feb','Mar','Apr','Ma&#xED;','J&#xFA;n',
		'J&#xFA;l','&#xC1;g&#xFA;','Sep','Okt','N&#xF3;v','Des'],
		dayNames: ['Sunnudagur','M&#xE1;nudagur','&#xDE;ri&#xF0;judagur','Mi&#xF0;vikudagur','Fimmtudagur','F&#xF6;studagur','Laugardagur'],
		dayNamesShort: ['Sun','M&#xE1;n','&#xDE;ri','Mi&#xF0;','Fim','F&#xF6;s','Lau'],
		dayNamesMin: ['Su','M&#xE1;','&#xDE;r','Mi','Fi','F&#xF6;','La'],
		weekHeader: 'Vika',
		dateFormat: 'dd/mm/yy',
		firstDay: 0,
		isRTL: false,
		showMonthAfterYear: false,
		yearSuffix: ''};
	$.datepicker.setDefaults($.datepicker.regional['is']);
});