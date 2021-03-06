/// <reference path="Classifer.ts"/>

class Method {
  protection: Protection;
  type: Array<string>;
  name: string;
  classifer: Classifer;
  parameters: Array<Attribute>;

  constructor(
    pr: Protection,
    type: string[],
    name: string,
    classifer: Classifer = Classifer.default,
    parameters: Array<Attribute> = new Array<Attribute>()
  ) {
    this.protection = pr;
    this.type = type;
    this.name = name;
    this.classifer = classifer;
    this.parameters = parameters;
  }

  setParam(name: string, type: string[]) {
    for (const p of this.parameters) {
      if (p.name === name) {
        p.type = type;
        return;
      }
    }
    this.parameters.push(new Attribute(Protection.internal, type, name));
  }

  toString(): string {
    const strb = new StringBuilder();
    strb.append(this.protection);
    strb.append(this.name);
    strb.append("(");
    const params = new Array<string>();
    for (const p of this.parameters) {
      params.push(`${p.name}: ${displayType(p.type)}`);
    }
    strb.append(params.join(", "));
    strb.append(")");
    strb.append(this.classifer);
    strb.append(" ");
    strb.append(displayType(this.type));
    return vowel(strb.toString());
  }

  codeGen(
    lng: string,
    p1: boolean | undefined = undefined,
    p2: string | undefined = undefined,
    p3: boolean | undefined = undefined
  ): string {
    const code = new StringBuilder();
    const params = new Array<string>();
    let abstr = false;
    let constructor = false;
    switch (lng) {
      case "cs":
        code.append(protectionToCode(this.protection));
        code.append(" ");
        if (this.classifer === Classifer.abstract) {
          code.append("abstract ");
          abstr = true;
        } else if (this.classifer === Classifer.static || p1) {
          code.append("static ");
        }
        if (this.name === p2) {
          constructor = true;
        } else {
          code.append(displayType(this.type, lng));
          code.append(" ");
        }
        code.append(this.name);
        for (const p of this.parameters) {
          params.push(`${displayType(p.type, lng)} ${p.name}`);
        }
        code.append(`(${params.join(", ")})`);

        if (abstr) {
          code.append(";");
        } else {
          code.append(
            "\n\t\t{\n\t\t\tthrow new NotImplementedException();\n\t\t}"
          );
        }
        break;
      case "ts":
        code.append(protectionToCode(this.protection));
        code.append(" ");
        if (this.classifer === Classifer.abstract) {
          code.append("abstract ");
          abstr = true;
        } else if (this.classifer === Classifer.static) {
          code.append("static ");
        }
        for (const p of this.parameters) {
          params.push(`${p.name}: ${displayType(p.type, lng)}`);
        }
        constructor = false;
        if (this.name === p2) {
          code.append("constructor");
          constructor = true;
        } else {
          code.append(this.name);
        }
        code.append(`(${params.join(", ")})`);
        if (!constructor) {
          code.append(": ");
          code.append(displayType(this.type, lng));
        }
        if (abstr) {
          code.append(";");
        } else {
          code.append(" {");
          if (constructor && p3) {
            code.append("\n\t\tsuper();");
          }
          if (p1) {
            code.append(
              '\n\t\t\tthrow new Error("Method not implemented"); \n\t\t} '
            );
          } else {
            code.append(
              '\n\t\tthrow new Error("Method not implemented"); \n\t} '
            );
          }
        }
        break;
      case "kt":
        code.append(protectionToCode(this.protection));
        code.append(" ");
        if (this.classifer === Classifer.abstract) {
          code.append("abstract ");
          abstr = true;
        } else if (this.classifer === Classifer.static) {
          code.append("static ");
        }
        for (const p of this.parameters) {
          params.push(`${p.name}: ${displayType(p.type, lng)}`);
        }
        constructor = false;
        if (this.name === p2) {
          code.append("constructor");
          constructor = true;
        } else {
          code.append(`fun ${this.name}`);
        }
        code.append(`(${params.join(", ")})`);
        if (!constructor) {
          code.append(": ");
          code.append(displayType(this.type, lng));
        }
        if (constructor) {
          code.append(" : super(/*Parameters needed*/) ");
        }
        if (!abstr) {
          code.append(
            ' {\n\t\tthrow Exception("Method not implemented"); \n\t}'
          );
        }
        break;
    }
    return code.toString();
  }
}
