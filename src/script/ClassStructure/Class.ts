/// <reference path="Protection.ts"/>
/// <reference path="Field.ts"/>
/// <reference path="Method.ts"/>

class Class {
  name: string;
  relations: Array<Relation>;
  classifer: Classifer;
  fields: Array<Field>;
  methods: Array<Method>;
  id: number = -1;

  constructor(name: string) {
    this.name = name;
    this.relations = new Array<Relation>();
    this.classifer = Classifer.default;
    this.fields = new Array<Field>();
    this.methods = new Array<Method>();
  }

  toString(): string {
    const strb = new StringBuilder();
    if (
      this.fields.length > 0 ||
      this.methods.length > 0 ||
      this.classifer !== Classifer.default
    ) {
      strb.appendWithLinebreak(`class ${this.name}{`);
      if (this.classifer === Classifer.abstract) {
        strb.appendWithLinebreak("<<abstract>>");
      } else if (this.classifer === Classifer.static) {
        strb.appendWithLinebreak("<<static>>");
      }
      this.forEachField((f: Field) => {
        strb.append("\t");
        strb.appendWithLinebreak(f.toString());
      });
      this.forEachMethod((m: Method) => {
        strb.append("\t");
        strb.appendWithLinebreak(m.toString());
      });
      strb.appendWithLinebreak("}");
    } else {
      strb.appendWithLinebreak(`class ${this.name}`);
    }
    this.forEachRelation((rel: Relation) => {
      strb.appendWithLinebreak(rel.toString());
    });
    return strb.toString();
  }

  addField(f: Field): void {
    this.fields.push(f);
  }

  addMethod(m: Method): void {
    this.methods.push(m);
  }

  addRelation(r: Relation): void {
    this.relations.push(r);
  }

  public forEachField(callback: (f: Field) => void): void {
    for (const f of this.fields) {
      callback(f);
    }
    return;
  }

  public forEachMethod(callback: (m: Method) => void): void {
    for (const m of this.methods) {
      callback(m);
    }
    return;
  }

  public forEachMember(
    callback: (m: Field | Method, $break: () => void) => void
  ): void {
    let ex = true;
    const _break = () => {
      ex = false;
    };
    for (const f of this.fields) {
      if (ex) {
        callback(f, _break);
      } else {
        return;
      }
    }
    for (const m of this.methods) {
      if (ex) {
        callback(m, _break);
      } else {
        return;
      }
    }
    return;
  }

  public forEachRelation(callback: (rel: Relation) => void): void {
    for (const rel of this.relations) {
      callback(rel);
    }
  }

  codeGen(lng: string): Page {
    const code = new StringBuilder();
    let stat = false;
    let inheritance = false;
    const imp = new Set<string>();
    const inheritanceList = new Array<string>();
    for (const rel of this.relations) {
      if (rel.relation === relationType.inheritance) {
        inheritanceList.push(rel.classB);
        imp.add(rel.classB);
      }
    }
    for (const f of this.fields) {
      for (const t of f.type) {
        if (structureHolder.findClass(t)) {
          imp.add(t);
        }
      }
    }
    for (const m of this.methods) {
      for (const t of m.type) {
        if (structureHolder.findClass(t)) {
          imp.add(t);
        }
      }
      for (const p of m.parameters) {
        for (const t of p.type) {
          if (structureHolder.findClass(t)) {
            imp.add(t);
          }
        }
      }
    }
    imp.delete(this.name);
    switch (lng) {
      case "cs":
        code.appendWithLinebreak(
          "using System;\nusing System.Collections.Generic;"
        );
        for (const module of imp) {
          code.appendWithLinebreak(`using ${structureHolder.name}.${module};`);
        }
        code.append("\n");
        code.appendWithLinebreak(`namespace ${structureHolder.name}\n{`);
        code.append("\tpublic ");
        if (this.classifer === Classifer.static) {
          stat = true;
          code.append("static ");
        } else if (this.classifer === Classifer.abstract) {
          code.append("abstract ");
        }
        code.append(`class ${this.name}`);
        inheritance = false;
        for (const rel of this.relations) {
          if (rel.relation === relationType.inheritance) {
            if (inheritance) {
              alert(
                "The selected language does not support multiple inheritance!"
              );
              break;
            } else {
              inheritance = true;
              code.append(` : ${rel.classB}`);
            }
          }
        }
        code.appendWithLinebreak("\n\t{");
        for (const f of this.fields) {
          code.appendWithLinebreak("\t\t" + f.codeGen(lng));
        }
        for (const m of this.methods) {
          code.appendWithLinebreak("\t\t" + m.codeGen(lng, stat, this.name));
        }
        code.appendWithLinebreak("\t}\n}");
        break;
      case "h":
        for (const module of imp) {
          code.appendWithLinebreak(`#include "${module}.h"`);
        }
        if (imp.size > 0) {
          code.append("\n");
        }
        code.appendWithLinebreak(`namespace ${structureHolder.name}\n{`);
        code.append("\t");
        if (this.classifer === Classifer.static) {
          stat = true;
          code.append("static ");
        } else if (this.classifer === Classifer.abstract) {
          code.append("abstract ");
        }
        code.append(`class ${this.name}`);
        inheritance = false;
        for (const rel of this.relations) {
          if (rel.relation === relationType.inheritance) {
            if (inheritance) {
              alert(
                "The selected language does not support multiple inheritance!"
              );
              break;
            } else {
              inheritance = true;
              code.append(` : ${rel.classB}`);
            }
          }
        }
        code.appendWithLinebreak("\n\t{");
        // Fields
        const publicFields = new StringBuilder();
        publicFields.appendWithLinebreak("\t\tpublic: ");
        const protectedFields = new StringBuilder();
        protectedFields.appendWithLinebreak("\t\tprotected: ");
        const privateFields = new StringBuilder();
        privateFields.appendWithLinebreak("\t\tprivate: ");
        for (const f of this.fields) {
          switch (f.protection) {
            case Protection.public:
              publicFields.appendWithLinebreak("\t\t\t" + f.codeGen(lng));
              break;
            case Protection.protected:
              protectedFields.appendWithLinebreak("\t\t\t" + f.codeGen(lng));
              break;
            case Protection.private:
            case Protection.internal:
              privateFields.appendWithLinebreak("\t\t\t" + f.codeGen(lng));
              break;
          }
        }
        if (publicFields.length > 11) {
          code.appendWithLinebreak(publicFields.toString());
        }
        if (protectedFields.length > 14) {
          code.appendWithLinebreak(protectedFields.toString());
        }
        if (privateFields.length > 12) {
          code.appendWithLinebreak(privateFields.toString());
        }
        // Methods
        const publicMethods = new StringBuilder();
        publicMethods.appendWithLinebreak("\t\tpublic: ");
        const protectedMethods = new StringBuilder();
        protectedMethods.appendWithLinebreak("\t\tprotected: ");
        const privateMethods = new StringBuilder();
        privateMethods.appendWithLinebreak("\t\tprivate: ");
        for (const m of this.methods) {
          switch (m.protection) {
            case Protection.public:
              publicMethods.appendWithLinebreak("\t\t\t" + m.codeGen(lng));
              break;
            case Protection.protected:
              protectedMethods.appendWithLinebreak("\t\t\t" + m.codeGen(lng));
              break;
            case Protection.private:
            case Protection.internal:
              privateMethods.appendWithLinebreak("\t\t\t" + m.codeGen(lng));
              break;
          }
        }
        if (publicMethods.length > 11) {
          code.appendWithLinebreak(publicMethods.toString());
        }
        if (protectedMethods.length > 14) {
          code.appendWithLinebreak(protectedMethods.toString());
        }
        if (privateMethods.length > 12) {
          code.appendWithLinebreak(privateMethods.toString());
        }
        code.appendWithLinebreak("\t}\n}");
        break;
      case "py":
        if (this.classifer === Classifer.static) {
          stat = true;
        }
        for (const module of imp) {
          code.appendWithLinebreak(`from ${module} import ${module}`);
        }
        if (imp.size > 0) {
          code.append("\n");
        }
        code.append(`class ${this.name}`);
        if (inheritanceList.length > 0) {
          code.append(` (${inheritanceList.join(", ")})`);
        }
        code.appendWithLinebreak(":");
        if (this.fields.length > 0 || this.methods.length > 0) {
          for (const f of this.fields) {
            code.appendWithLinebreak("\t" + f.codeGen(lng));
          }
          if (this.fields.length > 0) {
            code.append("\n");
          }
          for (const m of this.methods) {
            code.appendWithLinebreak("\t" + m.codeGen(lng, stat, this.name));
          }
        } else {
          code.appendWithLinebreak("\tpass");
        }
        break;
      case "ts":
        for (const module of imp) {
          code.appendWithLinebreak(`/// <reference path="${module}.ts"/>`);
        }
        if (imp.size > 0) {
          code.append("\n");
        }
        let abstr = false;
        for (const m of this.methods) {
          if (m.classifer === Classifer.abstract) {
            abstr = true;
            break;
          }
        }
        if (!abstr && this.classifer === Classifer.static) {
          stat = true;
        } else if (this.classifer === Classifer.abstract || abstr) {
          code.append("abstract ");
        }
        if (stat) {
          code.append(`const ${this.name} = (() => {\n\t`);
        }
        code.append(`class ${this.name} `);
        inheritance = false;
        for (const rel of this.relations) {
          if (rel.relation === relationType.inheritance) {
            if (inheritance) {
              alert(
                "The selected language does not support multiple inheritance!"
              );
              break;
            } else {
              inheritance = true;
              code.append(`extends ${rel.classB} `);
            }
          }
        }
        code.appendWithLinebreak("{");
        for (const f of this.fields) {
          if (stat) {
            code.append("\t");
          }
          code.appendWithLinebreak("\t" + f.codeGen(lng, stat));
        }
        for (const m of this.methods) {
          if (stat) {
            code.append("\t");
          }
          code.appendWithLinebreak(
            "\t" + m.codeGen(lng, stat, this.name, inheritance)
          );
        }
        if (stat) {
          code.append("\t");
        }
        code.appendWithLinebreak("}");
        if (stat) {
          code.appendWithLinebreak(`\treturn new ${this.name}();\n})();`);
        }
        break;
    }
    if (lng === "h") {
      let codeStr = code.toString();
      if (codeStr.includes("std::vector")) {
        codeStr = "#include <vector>\n" + codeStr;
      }
      if (codeStr.includes("std::string")) {
        codeStr = "#include <string>\n" + codeStr;
      }
      if (codeStr.includes("std::map")) {
        codeStr = "#include <map>\n" + codeStr;
      }
      codeStr = "#pragma once\n" + codeStr;
      return new Page(vowel(this.name), lng, vowel(codeStr));
    } else {
      return new Page(this.name, lng, code.toString());
    }
  }
}
