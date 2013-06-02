(function($){

    // UTILITY FUNCTIONS
    var date2string = function(date) {
        return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
    };

    var string2date = function(str) {
        return new Date(str);
    };

    var parseDateOption = function(opt) {
        if (typeof(opt) == 'string') {
            return string2date(opt);
        } else if (opt.getMonth) {
            return new Date(opt.getTime());
        }
    };

    function yearsAfter(date, offset) {
      var out = new Date(date.getTime());
      out.setFullYear(date.getFullYear() + offset);
      return out;
    };

    var getTextForCurrentValue = function(date, choice) {
        var text;
        switch (choice.type) {
            case 'constant':
                text = date2string(choice.value);
                break;
            case 'function':
                text = choice.date2text(date);
                break;
            case 'yearsAfter':
                text = String(date.getFullYear() - choice.origin.getFullYear());
                break;
            case 'pickDate':
                text = date2string(date);
                break;
            default:
                throw "Unreconized choice type."
        }
        return text;
    };

    var updateCurrentValue = function(text, choice) {
        var date;
        switch (choice.type) {
            case 'constant':
                date = choice.value;
                break;
            case 'function':
                date = choice.text2date(text);
                break;
            case 'yearsAfter':
                var offset = Number(text);
                date = yearsAfter(choice.origin, offset);
                break;
            case 'pickDate':
                date = new Date(text);
                break;
            default:
                throw "Unreconized choice type."
        }
        return date;
    };


    // note, this isn't perfectly accurate
    var yearsBetweenDates = function(date1, date2) {
        return date1.getFullYear() - date2.getFullYear();
    };

    // DROPDOWN PLUGIN
    var dateDropdownInit = function($dropdown, options) {

        // PARSE OPTIONS
        
        // defaults
        var settings = $.extend(true, {
            dropdownPosition: "left",
            defaultChoice: 0,
            inputId: "",
            initialValue: new Date(),
            class: "date-dropdown",
        }, options || {});

        var choice = settings.choices[settings.defaultChoice];
        settings.currentChoice = choice;
        settings.currentValue = updateCurrentValue(settings.initialValue, choice);

        // convert date-strings to date-objects
        for (var i = 0; i < settings.choices.length; i++) {
            var choice = settings.choices[i];

            switch (choice.type) {
                case 'yearsAfter':
                    choice.origin = parseDateOption(choice.origin);
                    break;
                case 'constant':
                    choice.value = parseDateOption(choice.value);
                    break;
            }
        }

        // save a copy of choices onto the object
        $dropdown.data('settings', settings);

        // GENERATE HTML
        var $choices = $("<ul>").addClass("dropdown-menu");
        for (var i = 0; i < settings.choices.length; i++) {
            var choice = settings.choices[i];
            var $link = $("<a>")
            .attr("href", "#")
            .text(choice.label);
            var $choice = $("<li>").append($link);
            $choices.append($choice);
        }

        var $btn = $("<button>")
        .addClass("btn dropdown-toggle")
        .attr("data-toggle", "dropdown")
        .append('<span class="current-option-label">')
        .append('<span class="caret">');

        var $btnGroup = $("<div>")
        .addClass("btn-group")
        .append($btn, $choices);

        var $input = $("<input>")
        .prop("id", settings.inputId)
        .prop("type", "text");

        if (settings.dropdownPosition == "left") {
            var alignmentClass = "input-prepend";
        } else {
            var alignmentClass = "input-append";
        }

        $dropdown.addClass(alignmentClass)
        .addClass(settings.class)
        if (settings.dropdownPosition == "left") {
            $dropdown.append($btnGroup, $input);
        } else {
            $dropdown.append($input, $btnGroup);
        }
        $dropdown.dateDropdown('choice', settings.defaultChoice);

        // SETUP VAL FUNCTIONS
        // override the val() function, preserving previous functionality in
        // case of conflicts with other plugins unless the div has the
        // date-dropdown class
        var origHookGet, origHookSet;
        if ($.valHooks.div) {
            origHookGet = $.valHooks.div.get;
            origHookSet = $.valHooks.div.set;
        } else {
            $.valHooks.div = {};
        }

        $.valHooks.div = {
            get: function(elem) {
                if (!$(elem).hasClass(settings.class)) {
                    if (origHookGet) {
                        return origHookGet(elem);
                    } else {
                        return "";
                    }
                }
                return date2string(settings.currentValue);
            },
            set: function(elem, val) {
                if (!$(elem).hasClass(settings.class)) {
                    if (origHookSet) {
                        origHookSet(elem, val);
                        return $dropdown;
                    }
                }
                settings.currentValue = parseDateOption(val);
                return $dropdown;
            }
        };

        // CHANGE LISTENERS
        $input.change(function(){
            var choice = settings.currentChoice;
            var text = $input.val();
            var date = updateCurrentValue(text, choice);
            settings.currentValue = date;
        });

        $dropdown.find('li').click(function(){
            var choiceNumber = $(this).prevAll('li').size();
            $dropdown.dateDropdown('choice', choiceNumber);
        });
    };

    var dateDropdownSelect = function($dropdown, choiceNumber) {
        var settings = $dropdown.data().settings;
        var $input = $dropdown.find('input');
        var choice = settings.choices[choiceNumber];
        settings.currentChoice = choice;

        if (choice.type == 'constant') {
            settings.currentValue = choice.value;
            $input.prop('disabled', true);
        } else {
            $input.prop('disabled', false);
        }

        var date = settings.currentValue;
        var text = getTextForCurrentValue(date, choice);
        $input.val(text);
        $dropdown.find('.current-option-label').text(choice.label + " ");
    };

    var dateDropdownRefresh = function($dropdown) {
        var settings = $dropdown.data().settings;
        var date = settings.currentValue;
        var choice = settings.currentChoice;
        var text = getTextForCurrentValue(date, choice);
    };

    $.fn.dateDropdown = function(arg){
        $dropdown = $(this);

        if (typeof(arg) == 'object') {
            dateDropdownInit($dropdown, arg);
        }
        else if (arg == 'refresh') {
            dateDropdownRefresh($dropdown);
        }
        else if (typeof(arg) == 'number') {
            dateDropdownSelect($dropdown, arg);
        }
        return $dropdown;
    };
})(jQuery);
