/// <reference path="ClassStructure/Class.ts"/>
/// <reference path="../../../rocket.ts/DataStructures/StringBuilder.ts"/>

const structureHolder = (() => {
  class StructureHolder {
    name: string = "unknown";
    namespace: Array<Class>;

    constructor() {
      this.namespace = new Array<Class>();
    }

    private forEachClass(callback: (cl: Class) => void): void {
      for (const cl of this.namespace) {
        callback(cl);
      }
    }

    collectMmd(): string {
      if (this.namespace.length === 0) {
        return "";
      }
      const mmd = new StringBuilder();
      mmd.appendLine("classDiagram");
      this.forEachClass((cl: Class) => {
        mmd.appendLine(cl.toString());
      });
      mmd.append("\n");
      return mmd.toString().replace(/<style>.+<\/style>/s, "");
    }

    addClass(cl: Class): number {
      for (let index = 0; index < this.namespace.length; index++) {
        this.namespace[index].id = index;
      }
      let id = this.namespace.push(cl);
      cl.id = id - 1;
      return id;
    }

    forceDeleteClass(name: string): boolean {
      const cached = this.findClassCache.get(name);
      if (
        typeof cached == "number" &&
        this.namespace.length < cached &&
        this.namespace[cached].name == name
      ) {
        this.namespace.splice(cached, 1);
        this.findClassCache.delete(name);
        return true;
      }

      for (let i = 0; i < this.namespace.length; i++) {
        if (this.namespace[i].name === name) {
          this.namespace.splice(i, 1);
          return true;
        }
      }
      return false;
    }

    findClassCache = new Map<string, number>();
    findClass(name: string): Class | undefined {
      const cached = this.findClassCache.get(name);
      if (
        typeof cached == "number" &&
        this.namespace.length < cached &&
        this.namespace[cached].name == name
      ) {
        return this.namespace[cached];
      }

      for (let i = 0; i < this.namespace.length; i++) {
        const cl = this.namespace[i];
        if (cl.name === name) {
          this.findClassCache.set(name, i);
          return cl;
        }
      }
      return undefined;
    }

    loadFile(f: File): void {
      try {
        if (f.name.endsWith(".cm")) {
          this.name = f.name.substr(0, f.name.length - 3);
          (<HTMLInputElement>(
            document.getElementById("projectName")
          )).value = this.name;
          var fr = new FileReader();
          fr.onload = function () {
            if (fr.result) {
              let res: string;
              if (typeof fr.result === "string") {
                res = fr.result;
              } else {
                var arr = new Uint8Array(fr.result);
                var array = new Array<number>();
                for (var i = 0; i < arr.byteLength; i++) {
                  array[i] = arr[i];
                }
                var str = String.fromCharCode.apply(String, array);
                if (/[\u0080-\uffff]/.test(str)) {
                  throw new Error(
                    "this string seems to contain (still encoded) multibytes"
                  );
                }
                res = str;
              }
              structureHolder.importJson(atob(res));
            }
          };
          fr.readAsText(f);
        } else {
          throw "Unexpected FileType";
        }
      } catch (e) {
        alert(e);
      }
    }
    importJson(json: string): void {
      try {
        const obj: Array<Class> = JSON.parse(
          json.replace(/\bfields\b/g, "attributes")
        );
        const tempNamespance = new Array<Class>();
        for (const clDta of obj) {
          const newCl = new Class(clDta.name);
          newCl.classifer = clDta.classifer;
          newCl.id = clDta.id;

          const tempAttributeList = new Array<Attribute>();
          for (const flDta of clDta.attributes) {
            tempAttributeList.push(
              new Attribute(
                signToProtection(flDta.protection),
                flDta.type,
                flDta.name,
                flDta.classifer
              )
            );
          }
          newCl.attributes = tempAttributeList;

          const tempMethodList = new Array<Method>();
          for (const mthDta of clDta.methods) {
            const tempParamList = new Array<Attribute>();
            for (const pDta of mthDta.parameters) {
              tempParamList.push(
                new Attribute(Protection.internal, pDta.type, pDta.name)
              );
            }
            tempMethodList.push(
              new Method(
                signToProtection(mthDta.protection),
                mthDta.type,
                mthDta.name,
                mthDta.classifer,
                tempParamList
              )
            );
          }
          newCl.methods = tempMethodList;

          const tempRelationList = new Array<Relation>();
          for (const rDta of clDta.relations) {
            tempRelationList.push(
              new Relation(
                rDta.classA,
                rDta.classB,
                rDta.relation,
                rDta.cardinalityA,
                rDta.cardinalityB,
                rDta.comment
              )
            );
          }
          newCl.relations = tempRelationList;

          tempNamespance.push(newCl);
        }
        this.namespace = tempNamespance;
        Ui.unfocus();
        Ui.render();
      } catch (e) {
        alert(e);
      }
    }

    /**
     * Rename Class
     */
    deepRename(oldName: string, newName: string) {
      for (const cl of this.namespace) {
        for (const f of cl.attributes) {
          for (let i = 0; i < f.type.length; i++) {
            if (f.type[i] === oldName) {
              f.type[i] = newName;
            }
          }
        }
        for (const m of cl.methods) {
          if (cl.name === oldName && m.name === oldName) {
            m.name = newName;
          }
          for (let i = 0; i < m.type.length; i++) {
            if (m.type[i] === oldName) {
              m.type[i] = newName;
            }
          }
          for (const p of m.parameters) {
            for (let i = 0; i < p.type.length; i++) {
              if (p.type[i] === oldName) {
                p.type[i] = newName;
              }
            }
          }
        }
        for (const r of cl.relations) {
          if (r.classA === oldName) {
            r.classA = newName;
          }
          if (r.classB === oldName) {
            r.classB = newName;
          }
        }
        if (cl.name === oldName) {
          cl.name = newName;
        }
      }
    }
    rename(el: HTMLInputElement): void {
      const name = remSpCh(el.value);
      if (name.length > 0) {
        structureHolder.name = name;
        el.value = name;
      }
    }
  }
  return new StructureHolder();
})();
