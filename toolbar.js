
var showing = false;
$(document).ready(function () {
    
    $(document).on('click', '#menubar>ul>li>a', function(e) {
        var elementToShow = $(this).attr('href');
        if (!showing) {
            showing = true;
            setTimeout(function() {
                $(elementToShow).addClass('slide-out');
            }, 100);
        } else {
            if (!$(elementToShow).hasClass('showing')) {
                $(elementToShow).addClass('showing');
            }
            if ($(elementToShow).hasClass('slide-out')) {
                $(elementToShow).removeClass('slide-out');
            }
        }
        $(elementToShow).addClass('active');
    });

    $(document).click(function(e) {
        var tabs = $('#menubar>ul>li>a');
        var containers = $('#toolbar:not(.pinned)>div');
        if ((!containers.is(e.target) && containers.has(e.target).length === 0)
            && (!tabs.is(e.target) && tabs.has(e.target).length === 0)
        ) {
            containers.removeClass('slide-out');
            containers.removeClass('showing');
            containers.removeClass('active');
            $('.application:not(.pinned-toolbar) #menubar>ul>li').removeClass('active');
            showing = false;
        }
    });

    $(document).on('click', 'a.pin', function(e) {
        e.preventDefault();
        $(this).toggleClass('active');
        var target = $(this).attr('href');
        $(target).toggleClass('pinned');
        if (target == '#toolbar') { // activate the first
            $('#menubar>ul>li>a[data-toggle=tab]').first().trigger('click');
        }
        $($(this).closest('.application')).toggleClass('pinned-' + $(this).attr('href').substr(1));
        editor.updateSize(); // soo static
    });

    $('#startscreen a[href=#back]').on('click', function(e){
        e.preventDefault();
        $('#startscreen').removeClass('active');
    });

    $('body [title]').tooltip({
        placement: 'auto bottom',
        container: 'body'
    });
    
});