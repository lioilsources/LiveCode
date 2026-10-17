// TODO: klíč metadat + dekorátor, který handler/controller označí jako veřejný.
//       Musí jít použít na třídu i na metodu.
export const IS_PUBLIC_KEY = 'isPublic';

export function Public(): ClassDecorator & MethodDecorator {
  return () => {
    // TODO
  };
}
