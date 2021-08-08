define({
    addToDom: function () {
        var div = document.createElement('div');
        div.id = 'one';
        div.setAttribute('data-name', 'one');
        document.getElementsByTagName('body')[0].appendChild(div);
    }
});
