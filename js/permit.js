/*
 * Permit.js
 * @version		0.4.0
 * @copyright	Tarek Anandan (http://www.technotarek.com)
 */
;(function($) {
    
    /** permit is a jQuery plugin that makes building interactive, multi-state 
    * prototypes for websites and apps easy.
    * @constructor
    * @param {object} options
    */
    $.permit = function(options) {

        var defaults = {
            // value: array permit levels, default to admin;
            // sets the available permission levels
            permits : [ 'admin' ],
            // Specifies the action to be taken when a new permit is issued using
            // the permits agent. Defaults to a javascript-enabled page reload.
            // Otherwise it redirects to the specified location.
            reissueDestination : 'reload',
            // Prefix for cookies name
            cPrefix : 'permit_',
            inlineStyle: false,

            issuePermit : issuePermitFromCookie,
            revokePermit : revokePermitFromCookie,
            validPermit : validPermitFromCookie
        };

        options = $.extend({}, defaults, options);
        var $inlineStyle;

        /**
         * Function for check permit
         * 
         * @param {string}    name permit
         */
        function validPermitFromCookie(name) {
            return ($.cookie(name) === '1');
        }

        /**
         * Function for revoke permit
         * 
         * @param {string}    name permit
         */
        function revokePermitFromCookie(name) {
            return $.removeCookie(name);
        }

        /**
         * Function for issue permit
         * 
         * @param {string}    name permit
         */
        function issuePermitFromCookie(name) {
            return $.cookie(name, '1');
        }

        /**
         * This function issues new permits
         * 
         * @param {string,array}   name permit
         * @param {string,null}    destination
         */
        function issuePermit(permit, destination) {
            // create the permit, give it a value of 1
            permit = permit instanceof Array ? permit : [permit];
            permit.forEach(function(value) {
               options.issuePermit(options.cPrefix + value);
            });
            director(destination);
        }

        /**
         * This function revokes a specific permit
         * 
         * @param {string,array}         name permit
         * @param {string,array,null}    newPermit if a type is specified, issue that
         * @param {string,null}          destination
         */
        function revokePermit(permit, newPermit, destination) {
            permit = permit instanceof Array ? permit : [permit];
            revokeAllPermits(permit);
            if (newPermit) {
                issuePermit(newPermit);
            }
            director(destination);
        }

        /**
         * This function handles all reloads/redirects after permits are issued
         * or revoked
         * 
         * @param {string} [destination='reload'] - reloads current page
         * @param {string} [destination=url]      - redirect to url
         * @param {null}   [destination=null]     - apply state on current pages
         */
        function director(destination) {
            destination = destination ? destination : options.reissueDestination;
            if (destination) {
                if (destination == 'reload') {
                    window.location.reload();
                } else {
                    window.location.href = destination;
                }
            } else {
                hide();
                show();
            }
        }

        /**
        * This function checks to see if any permits exist
        * 
        * @param {array,null}         permits
         */
        function permitExists(permits) {
            // if no parameter is passed to the function, set the parameter
            // equal to the permits setting object
            permits = permits ? permits : options.permits;
            var i = 0;
            permits.forEach(function(value) {
                if (options.validPermit(options.cPrefix + value)) {
                    i++;
                }
            });
            return i;
        }

        // This function builds the dynamic permit issuing agent to help issue
        // new permits
        function buildPermitAgent(permits) {
            var a = '<select id="permit-options" class="form-control input-sm">';
            permits.forEach(function(value) {
                a += '<option value="' + value + '">' + value + '</option>';
            });
            a += '</select>';
            $('#permit-agent').html(a);
        }

        // This function revokes all permits
        function revokeAllPermits(permits) {
            permits.forEach(function(value) {
                options.revokePermit(options.cPrefix + value);
            });
        }

        function hide() {
            if (!options.inlineStyle){
                // hide default permitted content
                $('.permit-all, .permit-force').hide();
                // hide user specified permitted content
                options.permits.forEach(function(value) {
                    $('.permit-' + value).hide();
                });
            } else {
                $inlineStyle.html('.permit-none {display: inline !important;}')
            }
        }

        function show() {
            if (!options.inlineStyle){
                $.each($(options.permits), function(index, value) {

                    // Iterate through user specified permits to show permitted
                    // content
                    if (options.validPermit(options.cPrefix + value)) {
                        $('.permit-' + value).show();
                    }
                });

                // check to see if any permits exist, if not...
                if (permitExists() < 1) {
                    // show public content
                    $('.permit-none').show();
                    // show forced message content based on data-permit-message
                    // attribute
                    $('.permit-force').each(function() {
                        var message = $(this).data('permit-message');
                        $(this).html(message).show();
                    });
                } else {
                    // if any permit exists, hide permit-less state content
                    $('.permit-none').hide();
                    // if any permit exists, show globally permitted state content
                    $('.permit-all').show();
                }
            } else {
                var p = [];
                options.permits.forEach(function(value) {
                    if (options.validPermit(options.cPrefix + value)) {
                        p.push('.permit-' + value);
                    }
                })
                if (p.length) {
                    p.push('.permit-all');
                    p.push('.permit-force');
                } else {
                    p.push('.permit-none');
                }
                $inlineStyle.html(p + ' {display: inline !important;}');
            }
        }

        function bind() {
            $.each($(options.permits), function(index, value) {
                // Create custom permit issuing triggers
                var triggerEvent = ($('.permit-issue-' + value).data(
                        'permit-trigger') ? $('.permit-issue-' + value).data(
                        'permit-trigger') : 'click');
                $('.permit-issue-' + value).on(triggerEvent, function() {
                    var destination = $(this).data('permit-destination');
                    revokeAllPermits(options.permits);
                    issuePermit(value, destination);
                });

                // Create custom permit revoking triggers
                var triggerEvent = ($('.permit-revoke-' + value).data(
                        'permit-trigger') ? $('.permit-revoke-' + value).data(
                        'permit-trigger') : 'click');
                $('.permit-revoke-' + value).on(triggerEvent, function() {
                    var destination = $(this).data('permit-destination');
                    var newPermit = $(this).data('permit-new');
                    revokePermit(value, newPermit, destination);
                });
            });

            // Issue new permit via Agent
            $('.permit-reissue').on('click', function() {
                // remove all existing permits
                revokeAllPermits(options.permits);
                // determine selected permit
                var permit = $('#permit-options').val();
                // issue new permit
                issuePermit(permit);
            });

            // Revoke all permits and redirect
            $('.permit-revoke-all').on('click', function() {
                var destination = $(this).data('permit-destination');
                revokeAllPermits(options.permits);
                director(destination);
            });
        }

        function init() {
            if (options.inlineStyle) {
                $inlineStyle = $('<style>', {type:"text/css"})
                $('head').append($inlineStyle)
            }
            hide();
            show();
            bind();
            buildPermitAgent(options.permits);
        }

        // Public API

        $.extend($.permit, {
            issuePermit : issuePermit,
            revokePermit : revokePermit,
            revokeAllPermits : revokeAllPermits,
            init : init
        });

        init();
    };

})(jQuery);
