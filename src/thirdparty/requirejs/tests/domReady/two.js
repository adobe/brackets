define({
    addToDom: function () {
        var div = document.createElement('div');
        div.id = 'two';
        div.setAttribute('data-name', 'two');
        document.getElementsByTagName('body')[0].appendChild(div);
    }
});
