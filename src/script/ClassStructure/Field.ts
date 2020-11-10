/// <reference path="Classifer.ts"/>

class Field {
  protection: Protection;
  type: Array<string>;
  name: string;
  classifer: Classifer;
  constructor(
    pr: Protection,
    type: Array<string>,
    name: string,
    classifer: Classifer = Classifer.default
  ) {
    this.protection = pr;
    this.type = type;
    this.name = name;
    this.classifer = classifer;
  }

  toString(): string {
    const strb = new StringBuilder();
    strb.append(this.protection);
    strb.append(displayType(this.type));
    strb.append(" ");
    strb.append(this.name);
    strb.append(this.classifer);
    return vowel(strb.toString());
  }

  codeGen(lng: string, p1: boolean | undefined = undefined): string {
    const code = new StringBuilder();
    switch (lng) {
      case "cs":
        code.append(protectionToCode(this.protection));
        code.append(" ");
        if (this.classifer === Classifer.static) {
          code.append("static ");
        }
        code.append(displayType(this.type, lng));
        code.append(" ");
        code.append(this.name);
        if (this.protection === Protection.public) {
          code.append(" { get; set; }");
        } else {
          code.append(";");
        }
        break;
      case "h":
        if (this.classifer === Classifer.static) {
          code.append("static ");
        }
        code.append(displayType(this.type, lng));
        code.append(" ");
        code.append(this.name);
        if (this.type[0] === "vector") {
          code.append("[3]");
        }
        code.append(";");
        break;
      case "ts":
        code.append(protectionToCode(this.protection));
        code.append(" ");
        if (this.classifer === Classifer.static || p1) {
          code.append("static ");
        }
        code.append(this.name);
        code.append(": ");
        code.append(displayType(this.type, lng));
        code.append(";");
        break;
      case "qs":
        code.append("operation ");
        code.append(this.name);
        code.append(` () : `);
        code.append(displayType(this.type, lng));
        code.appendWithLinebreak(
          ` {\n\t\treturn ${defaultQs(this.type)};\n\t}`
        );
        break;
    }
    return code.toString();
  }
}
