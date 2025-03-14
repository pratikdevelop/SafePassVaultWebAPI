"""d2x
This module converts a python dict to an XML string.

In python, we represent each XML tag name as a key in a dict where the contents
of the tag is the value of the key.  In XML, every piece of data must be 
wrapped in a tag.  A consequence is that not every python dict represents a 
valid XML string.

If the parser detects any untagged values it raises a ValueError.

usage::

    >>> my_dict = { ... }
    >>> import d2x
    >>> parser = d2x.DictToXML()
    >>> xml_string = parser.to_xml(my_dict)

You may change the the number of spaces per tab stop from the default of 4::

    >>> parser = d2x.DictToXML(tab_size=2)

You may change the initial indentation level from the default of 0::

    >>> xml_string = parser.to_xml(my_dict, level=2)
"""
import collections

class DictToXML():
    def __init__(self, tab_size=4):
        self.tab_size = tab_size

    def to_xml(self, d, level=0):
        """Converts a python dict (or a list of single key dicts) to an XML 
        string.  The string is "pretty" printed so each tag is indented to 
        reflect its nesting level.  Tags containing a single value are printed
        on a single line; otherwise the opening and closing tags are on lines
        by themselves and the contents are indented another tab stop.

        If a dict is not an OrderedDict, its keys are listed alphabetically.
        
        d - the python object to convert.
        level - the indentation level (number of tab_stops) to start with.
        """
        a = []
        if isinstance(d, dict):
            if d:
                indent = ' ' * (self.tab_size *  level)
                if isinstance(d, collections.OrderedDict):
                    keys = d.keys() 
                else:
                    keys = sorted(d.keys())
                for key in keys:
                    value = d[key]
                    tag = key.split()[0]
                    if type(value) in [list, dict] and value:
                        a.append('%s<%s>' % (indent, key))
                        a.append(self.to_xml(value, level=level + 1))
                        a.append('%s</%s>' % (indent, tag))
                    else:
                        a.append('%s<%s>%s</%s>' % (
                                indent,
                                key,
                                '' if type(value) in [list, dict] else value,
                                tag))
            else:
                pass # ignore empty dict
        elif isinstance(d, list):
            for item in d:
                if type(item) == dict and len(item) == 1:
                    a.append(self.to_xml(item, level=level))
                else:
                    raise ValueError, (
                            'list item %s must be a dict with one key' % item)
        else:
            raise ValueError, '%s not list or dict' % d
        return '\n'.join(a)

