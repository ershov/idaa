#!/usr/bin/perl

#
# Top-level comment: section title
#     file.js sets script
#     @id sets id
#     #disabled anywhere in the comment disables the feature by default
#
# Comment after '{' sets section subtitle
#
# Empty line before section title makes small spacing gap
#
# Empty line before and after section title makes big spacing gap
#
# Comment after css property format:
#
# "Title" : nothing
# "@N Title" : numeric parameter at position N
# "@N @id Title" : numeric parameter at position N, id
#
# "@N=EXPR" : calculate the value. 'settings' refers to global settings.
#
# Top-level comments starting with empty line and ending with empty line deleted
#

use 5.14.0;
use strict;
use warnings;

use IO::File;

my $DEBUG = 0;

my $F = IO::File->new("style.css", "r") or die "style.css: $!";

my $class = $ARGV[0];
my $prev_isempty = 1;
my $prev_istitle = 0;
my $isempty = 0;
my $istitle = 0;
my $enabled = "true";
my $title = "";
my $title_id = "";
my $has_scripts = 0;
my $script = "";
my $script_txt = "";
my $subtitle = "";
my $split_size = "big";
my $stylesheet = "";
my $in_comment = 0;
my @params;
my @params_derived;
my @all_ids;

sub ReadAll($;$) {
  eval { my $ret; IO::File->new($_[0], "r")->read($ret, 9999); $ret } || $_[1];
}
sub ReadScript($) {
  return "" if !$_[0];
  my $ret; IO::File->new($_[0], "r")->read($ret, 9999); $ret;
}

sub strip($) {
    local $_ = shift;
    s/^\s+//;
    s/\s+$//;
    return $_;
}

sub StToVarName($) {
  local $_ = shift;
  s/[^a-zA-Z0-9_]/_/g;
  return $_;
}

sub StToDescription($) {
  local $_ = shift;
  s/-/ /g;
  s/(\S+)/ucfirst($1)/eg;
  return $_;
}

sub DescrToVarName($) {
  local $_ = shift;
  s/[^a-zA-Z0-9_]/_/g;
  return lc $_;
}

# String, index, replacement
sub ReplaceVar($$$) {
    local $_ = shift;
    my ($paramIdx, $replacement) = @_;

    my $re = ('\D++\d++'x($paramIdx-1)) . '\D++(\d++)';
    /$re/ or die "Param index error at $.: index = $paramIdx  re=$re : $_";
    my $default = substr($_, $-[1], $+[1] - $-[1]);
    $_ = substr($_, 0, $-[1]) . "\${$replacement}" . substr($_,$+[1]);

    return ($_, $default);
}

sub EscapeJS($) {
  local $_ = $_[0];
  s/([\\`\$])/\\$1/g;
  return "`$_`";
}

sub DoSection() {
    return if !$title;
    printf "     %60s %s\n", "(end section)", "- split: $split_size -" if $DEBUG;
    $stylesheet = strip $stylesheet;
    $script = strip $script;
    $has_scripts = 1 if $script;
    return if (!$stylesheet && !$script);
    push @all_ids, $title_id;
    say << "_END";
///////////////////////////////////////////////////////////
// Functions for $title_id : $title
// Split: $split_size
// Params: @{[join ", ", map {"[@$_]"} @params]}

static $title_id = class {

static params = [@{[join ", ", map {qq{"$_->[0]"}} @params]}];

static SetDefaults(settings) {
  if (!settings.hasOwnProperty('$title_id')) settings.$title_id = {};
  let s = settings.$title_id;
  s._enabled = $enabled;
@{[join "\n", map {
"  s.$_->[0] = $_->[2];"
  } @params]}
}

static SetMissing(settings) {
  if (!settings.hasOwnProperty('$title_id')) settings.$title_id = {};
  let s = settings.$title_id;
  if (!s.hasOwnProperty('_enabled')) s._enabled = $enabled;
@{[join "\n", map {
"  if (!s.hasOwnProperty('$_->[0]')) s.$_->[0] = $_->[2];"
  } @params]}
}

static IsEnabled(settings) {
  @{[
$title_id =~ /^dark_mode_/ ? strip << "_END_DEP_DARK" : strip << "_END_NODEP"
  // Dependant on Dark Mode
  if (!settings.$title_id._enabled) return false;
  if (settings.dark_mode && !settings.dark_mode._enabled) return false;
  return true;
_END_DEP_DARK
  return settings.$title_id._enabled;
_END_NODEP
]}
}

static GenStyle(settings) {
  this.SetMissing(settings);
  let s = settings.$title_id;
  if (!this.IsEnabled(settings)) return "/* Disabled: $title */\\n\\n";
  let {@{[join ", ", map {"$_->[0]"} @params]}} = s;
  return `
/* $title */
$stylesheet
`;
}

static GenScriptUrls(settings) {
  return this.IsEnabled(settings) ? [@{[$script ? qq{"$script"} : ""]}] : [];
}
@{[
#static GenScripts(settings) {
#  return this.IsEnabled(settings) ? [@{[$script_txt ? EscapeJS $script_txt : ""]}] : ["/* Disabled: $title */\\n"];
#}
#
#static DoScript(settings) {
#  this.GetScript()();
#}
]}
static GetScript(settings) {
  return this.IsEnabled(settings) ? ()=>{
$script_txt
  } : ()=>{};
}

static GenSettingsUi(settings) {
  this.SetMissing(settings);
  let s = settings.$title_id;
  return `@{[$split_size eq 'big' ? "  <li><hr>" : $split_size eq 'minor' ? "  <li style=height:0.5em ><BR>" : ""]}
  <li@{[ $script ? " has_script" : ""]}>
  <input type=checkbox name=${class}_${title_id}_enabled id=${class}_${title_id}_enabled _site=$class _section_id="${title_id}" _setting_id="_enabled" \${s._enabled ? "checked" : ""}>
  <label for=${class}_${title_id}_enabled> $title</label>
@{[!@params ? "" : << "_E"
  <ul>
@{[join "\n", map {
qq{    <li><input
      name=${class}_${title_id}_$_->[0]_range
      type=range
      min=0
      max=@{[$_->[2] < 20 ? 50 : $_->[2] < 100 ? 200 : 1000]}
      value=\${s.$_->[0]}
      _site=$class
      _section_id="${title_id}"
      _setting_id="$_->[0]"
      _default="$_->[2]"
      ><input
      name=${class}_${title_id}_$_->[0]_val
      size=3
      value=\${s.$_->[0]}
      _site=$class
      _section_id="${title_id}"
      _setting_id="$_->[0]"
      _default="$_->[2]"
      > $_->[3]}} @params]}
  </ul>
_E
]}
`;
}

static ImportSettingsFromForm(form, settings) {
  if (!settings.hasOwnProperty('$title_id')) settings.$title_id = {};
  let s = settings.$title_id;
  let e = form.elements;
  s._enabled = e.${class}_${title_id}_enabled.checked;
@{[join "\n", map {
"  if (isNaN(s.$_->[0] = parseInt(e.${class}_${title_id}_$_->[0]_val.value))) s.$_->[0] = $_->[2];"
  } @params]}
}

static ApplySettingsToForm(settings, form) {
  this.SetMissing(settings);
  let s = settings.$title_id;
  let e = form.elements;
  e.${class}_${title_id}_enabled.checked = s._enabled;
@{[join "\n", map {
"  e.${class}_${title_id}_$_->[0]_range.value = e.${class}_${title_id}_$_->[0]_val.value = s.$_->[0];"
  } @params]}
}

};  // end of nested class $title_id

_END
}

sub DoFinalize() {
    say << "_END";
///////////////////////////////////////////////////////////
// Interface functions

static id = "${class}";
static fields = [@{[join ", ", map {qq{"$_"}} @all_ids]}];

static GenStyle(settings) {
  if (settings._module_enabled === false) return "/* Module ${class} disabled */";
  return ""+
@{[join " +\n", map {
"  this.$_.GenStyle(settings)"
  } @all_ids]};
}

static GenScriptUrls(settings) {
  if (settings._module_enabled === false) return [];
  return [
@{[join ",\n", map {
"    ...this.$_.GenScriptUrls(settings)"
  } @all_ids]}
  ];
}
@{[
#static GenScripts(settings) {
#  if (settings._module_enabled === false) return [];
#  return [
#@{[join ",\n", map {
#"    ...this.$_.GenScripts(settings)"
#  } @all_ids]}
#  ];
#}
#
#static DoScript(settings) {
#  this.GetScript(settings)();
#}
]}
static GetScript(settings) {
  if (settings._module_enabled === false) return ()=>{};
  let scripts = [
@{[join ",\n", map {
"    this.$_.GetScript(settings)"
  } @all_ids]}
  ];
  return ()=>scripts.forEach(script => {
    let ex;
    try {
      script();
    } catch(ex) {
      console.error(ex);
    }
  });
}

static SetDefaults(settings) {
@{[join "\n", map {
"  this.$_.SetDefaults(settings);"
  } @all_ids]}
}

static GenSettingsUi(settings) {
  return ""+
@{[join " +\n", map {
"  this.$_.GenSettingsUi(settings)"
  } @all_ids]};
}

static ImportSettingsFromForm(form, settings) {
@{[join "\n", map {
"  this.$_.ImportSettingsFromForm(form, settings);"
  } @all_ids]}
}

static ApplySettingsToForm(settings, form) {
@{[join "\n", map {
"  this.$_.ApplySettingsToForm(settings, form);"
  } @all_ids]}
}

_END
}

say "class $class {";

while (defined($_ = $F->getline())) {
    $prev_isempty = $isempty;
    $prev_istitle = $istitle;
    $isempty = 0+/^$/m;
    $istitle = 0;
    if (m{^/\* (.+) \*/\s*$}m) {
        $istitle = 1;
        DoSection();
        $title = strip $1;
        $enabled = !($title =~ s/\s*+\#disabled\s*+//) ? "true" : "false";
        $script = ($title =~ s/^(\S+?\.js)\s*// ? $1 : "");
        $title_id = DescrToVarName($title =~ s/^@(\w++)\s*// ? $1 : $title);
        $script_txt = ReadScript $script;
        if (!$title) {
          $script_txt =~ /^\/\/[\/]*(.*?)\n/ms || die "No title and no script comment";
          $title = strip $1;
          $title_id = DescrToVarName($title =~ s/^@(\w++)\s*// ? $1 : $title);
        }
        printf "     %60s %s\n", "(id)", $title_id if $DEBUG;
        printf "     %60s %s\n", "(script)", $script if $DEBUG;
        $stylesheet = "";
        @params = ();
        @params_derived = ();
        printf "$prev_isempty$isempty$prev_istitle$istitle %60s %s", $title, $_ if $DEBUG;
        if ($prev_isempty) {
            $split_size = "minor";
            printf "     %60s\n", "-minor split-" if $DEBUG > 1;
        } else {
            printf "     %60s\n", "-no split-" if $DEBUG > 1;
            $split_size = "no";
        }
        next;
    }

    if ($isempty && $prev_istitle) {
        $split_size = "big";
        printf "     %60s\n", "-big split-" if $DEBUG > 1;
    }

    if (m{^/\*$}) {
        $in_comment = 1;
        printf "     %60s %s", "(comment start)", $_ if $DEBUG;
        next;
    }
    if (m{^\*/$}) {
        $in_comment = 0;
        printf "     %60s %s", "(comment end)", $_ if $DEBUG;
        next;
    }
    if ($in_comment) {
        printf "     %60s %s", "(comment)", $_ if $DEBUG;
        next;
    }

    printf "$prev_isempty$isempty$prev_istitle$istitle %60s %s", $title, $_ if $DEBUG;

    if (/\{/) {
        $subtitle = m{/\*(.+)\*/} ? strip($1) : "";
        print "subtitle = $subtitle\n" if $DEBUG > 1;
    } elsif (m{\s*/\*(.+)\*/\s*$}) {
        my $txt = $1;
        $txt =~ s/\s+$//;
        $txt =~ s/^\s+//;
        if ($txt =~ m/^@(\d++)=(.*+)/) {
            my ($paramIdx, $formula) = ($1, $2);
            $formula = strip $formula;
            ($_, my $default) = ReplaceVar($_, $paramIdx, $formula);
            print "$paramIdx = $formula\n" if $DEBUG;
            push @params_derived, [$paramIdx, $formula];
        } elsif ($txt =~ s/^@(\d++)\s*+//) {
            my ($paramIdx, $varName) = ('', '');
            $paramIdx = $1;
            if ($txt =~ s/^@(\w++)\s*+//) {
                $varName = $1;
            }
            my $stName = /(\S+):/ ? $1 : die "Style error at $.: $_";
            $varName ||= StToVarName($stName);
            $varName = StToVarName($subtitle)."_$varName" if $subtitle;
            $txt ||= StToDescription($stName);
            $txt = "$subtitle: $txt" if $subtitle;
            ($_, my $default) = ReplaceVar($_, $paramIdx, $varName);
            print "$varName : $paramIdx = $default : $txt\n" if $DEBUG;
            push @params, [$varName, $paramIdx, $default, $txt];
        }
    }

    printf "$prev_isempty$isempty$prev_istitle$istitle %60s %s", $title, $_ if $DEBUG > 1;
    $stylesheet .= $_;
}

DoSection();

DoFinalize();

close $F;

say "static has_scripts = $has_scripts;\n";

say "static descr = `".ReadAll("readme.txt", "")."`;\n";

say "static urls = [".(join ", ", map {chomp; qq{"$_"}} IO::File->new("url.txt", "r")->getlines())."];\n";

say "} // end of global class $class";

