import fontforge
import os
import base64
import json

def CreateIconFont(name, files, target):
    font = fontforge.font()

    font.fontname = name
    font.fullname = name
    font.familyname = name

    char = 0xE000

    mapping = { }

    for svg in files:
        if os.path.splitext(svg)[1] == ".svg":
            key = os.path.splitext(os.path.basename(svg))[0].replace("_", "-")
            mapping[key] = char
            #print "%04x - %s" % (char, key)
            glyph = font.createChar(char)
            glyph.importOutlines(svg)
            # Rest on the baseline.
            bbox = glyph.boundingBox()

            lb = glyph.left_side_bearing
            rb = glyph.right_side_bearing

            glyph.transform([1, 0, 0, 1, 0, 50])
            # Set side bearings.
            #print glyph.left_side_bearing, glyph.right_side_bearing
            glyph.right_side_bearing = (1000 + rb)
            glyph.left_side_bearing = lb
            char += 1

    font.generate(target + ".temp.ttf")

    face = """
    @font-face {
      font-family: '%s';
      src: url('data:application/octet-stream;base64,%s') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    """ % (name,
        base64.b64encode(open(target + ".temp.ttf").read())
    )

    os.unlink(target + ".temp.ttf")

    css = face + "\n".join([
     """
     .%s:before {
        font-family: "%s" !important;
        content: "\\%04x";
        speak: none;
        font-style: normal;
        font-weight: normal;
        font-variant: normal;
        text-transform: none;
        line-height: 1;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
     }
     """ % (
        key, name, mapping[key]
     )
     for key in mapping
    ]) + "\n"

    f_css = open(target, "w")
    f_css.write(css.encode("utf-8"))
    f_css.close()
    for key in mapping:
        mapping[key] = unichr(mapping[key])
    f_js = open(target + ".js", "w")
    f_js.write(("FONT_" + name + " = " + json.dumps(mapping) + ";").encode("utf-8"))
    f_js.close()

from os import listdir
files = map(lambda x: os.path.join("svg", x), listdir("svg"))
CreateIconFont("chartaccent_icons", files, "iconfont.less")
