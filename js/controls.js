var filters = {};

function fill_row() {
    $('#first-row').empty();
    $('#second-row').empty();
    $.ajax("http://127.0.0.1:5000/products", {
        data: JSON.stringify(filters), contentType: 'application/json', type: 'POST', success: function (json) {
            console.log(json);
            for (var i = 0; i < json.length; ++i) {
                var phone_name = json[i]['name'];

                var phone_image = json[i]['store_urls'][0]['image_url'];
                for (var j = 0; j < json[i]['store_urls'].length; ++j) {
                    var store = json[i]['store_urls'][j]['store'];
                    var store_logo = (store === "emag") ? store_logo = "https://s12emagst.akamaized.net/layout/ro/images/logo//38/57629.png" : "http://s.cel.ro/includes/templates/cel/images/logo.png";
                    var phone_price = json[i]['store_urls'][j]['price'];
                    var phone_url = json[i]['store_urls'][j]['url'];

                    var stores_string = '<li class="store"> <img class="inline store-logo" src=' + store_logo + '> <div class="inline store-price"><h3><a href="' + phone_url + '">' + phone_price + 'LEI</a></h3></div> </li>';
                }

                row = i < 2 ? $('#first-row') : $('#second-row');

                row.append('<div class="item"> <img class="phone-image" src=' + phone_image + '> <div class= "phone-name"><h2>' + phone_name + '</h2></div><ul class="store-list">' + stores_string + '</ul></div>');
            }
        }
    });

}

$(document).ready(function () {
    $('.phone').on('click', function () {
        Reveal.slide(2);
    });
    $('.laptop').on('click', function () {
        Reveal.slide(3);
    });
    $('.pc').on('click', function () {
        Reveal.slide(3);
    });
    $('.headpones').on('click', function () {
        Reveal.slide(3);
    });

    $('.home').on('click', function () {
        Reveal.slide(0);
    });
    $('.next').on('click', function () {

        var i = Reveal.getState()['indexh'];
        var j = Reveal.getState()['indexv'];
        var k = Reveal.getState()['indexf'];

        Reveal.down();

        var ii = Reveal.getState()['indexh'];
        var jj = Reveal.getState()['indexv'];
        var kk = Reveal.getState()['indexf'];
        Reveal.setState({'indexh': ii, 'indexv': jj, 'indexf': kk});
        if (Reveal.getState()['indexv'] === j)
            Reveal.setState({'indexh': i, 'indexv': j + 1, 'indexf': k});

    });

    $('.usage').on('click', function () {
        filters["battery"] = ($('input#checkbox2').is(':checked') || $('input#checkbox3').is(':checked') || $('input#checkbox4').is(':checked')) ? "yes" : "no";
        filters["ram"] = ($('input#checkbox3').is(':checked')) ? "yes" : "no";
    });

    $('input').on('change', function () {
        filters["price"] = $('input[name=budget]:checked').val();
        filters["size"] = $('input[name=size]:checked').val();
        filters["sim"] = $('input[name=sim]:checked').val();
        filters["camera"] = $('input[name=camera]:checked').val();
        filters["selfie"] = $('input[name=selfie]:checked').val();
    });

    $('.final').on('click', function () {
        var i = Reveal.getState()['indexh'];
        var j = Reveal.getState()['indexv'];
        var k = Reveal.getState()['indexf'];

        Reveal.down();

        var ii = Reveal.getState()['indexh'];
        var jj = Reveal.getState()['indexv'];
        var kk = Reveal.getState()['indexf'];
        Reveal.setState({'indexh': ii, 'indexv': jj, 'indexf': kk});
        if (Reveal.getState()['indexv'] === j)
            Reveal.setState({'indexh': i, 'indexv': j + 1, 'indexf': k});
        fill_row();
    });
});

