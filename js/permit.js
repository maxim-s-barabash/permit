/*
* Permit.js
* @version		0.1
* @copyright	Tarek Anandan (http://www.technotarek.com)
*/
;(function($) {

    var settings;
    $.permit = function(options){
        settings = jQuery.extend({
            permits: ['admin'], // value: array permit levels, default to admin; sets the available permission levels
            issueDestination: 'reload',
            revokeDestination: 'http://'+window.location.hostname
        },options);

        $(document).ready(function() {

            // hide default permitted content
            $('.permit-all, .permit-force').hide();
            // hide user specified permitted content
            $.each($(settings.permits), function(index, value) {
                $('.permit-'+value).hide();
            });

            var cPrefix = 'permit_';

            // Iterate through user specified permits to show permitted content
            $.each($(settings.permits), function(index, value) {

                if($.cookie(cPrefix+settings.permits[index]))
                {
                    // hide all permit content except selected permits
                    for(var i=0;i<settings.permits.length;i++)
                    {
                        if(i!=index)
                        {
                            $('.permit-'+value).hide();
                        }
                    }
                    // show permitted content
                    $('.permit-'+value).show();
                }

            });

            // check to see if any permits exist, if not...
            if(permitExists()<1){
                // show public content
                $('.permit-none').show();
                // show forced message content based on data-permit-message attribute
                $('.permit-force').each(function() {
                    var message = $(this).data('permit-message');
                    $(this).html(message).show();
                });
            }else{
                // if any permit exists, hide permit-less state content
                $('.permit-none').hide();
                // if any permit exists, show globally permitted state content
                $('.permit-all').show();
            }

            function issuePermit(permit) {
                // create the permit, give it a value of 1
                $.cookie(cPrefix+permit, 1);
                // either reload the page or redirect to location based on user settings
                if(settings.issueDestination === 'reload')
                {
                    window.location.reload();
                }else
                {
                    window.location.href = settings.issueDestination;
                }
            }

            function revokeAllPermits(permits){
                $.each($(permits), function(index, value) {
                    $.removeCookie(cPrefix+value);
                });
            }

            function permitExists(permit){
                // if no parameter is passed to the function, set the parameter equal to the permits setting object
                permit = typeof permit !== 'undefined' ? permit : settings.permits;
                var i = 0;
                $.each($(settings.permits), function(index, value) {
                    if($.cookie(cPrefix+settings.permits[index]))
                    {
                        i++;
                    }
                });
                return i;
            }

            // builds dynamic permit issuing agent
            function buildPermitAgent(permits){
                var mu = '<select id="permit-options" class="form-control input-sm">';
                $.each($(permits), function(index, value) {
                    mu += '<option value="'+value+'">'+value+'</option>';
                });
                mu += '</select>';

                $('#permit-agent').html(mu);
            }

            buildPermitAgent(settings.permits);

            // Issue default permit
            $('.permit-issue').on('click', function()
            {
                issuePermit(settings.permits[0]);
            });

            // Issue new permit
            $('.permit-reissue').on('click',function(){

                // remove all existing permits
                revokeAllPermits(settings.permits);
                // determine selected permit
                var permit = $('#permit-options').val();
                // issue new permit
                issuePermit(permit);

            });

            // Revoke all permits and redirect
            $('.permit-revoke').on('click',function()
            {
                revokeAllPermits(settings.permits);
                window.location.href = settings.revokeDestination;
            });

        });

    };

})(jQuery);