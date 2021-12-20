import { Injectable, EventEmitter } from '@angular/core';
import { ItemCardapio } from './item.cardapio';
import { collection, getDocs, setDoc, doc, query, where } from 'firebase/firestore';
import { firestore } from '../firebase';
import { Observable, from, map, pipe } from 'rxjs';

@Injectable({
  // TODO provide only when necessary
  providedIn: 'root'
})
export class CardapioMiddleBackService {
  constructor() { }

  // TODO change to subject so its not necessary to 
  tellRefresh = new EventEmitter<any> (true)

  tellRefreshCats = new EventEmitter<any> (true)

  // ? analisa se já existe um Item de mesmo nome
  _checkItemExistence(form: ItemCardapio) : Observable<any> {
    // ? um parâmetro da query que filtra a busca
    let queryConstrain = where('nome', '==', form.nome)

    // ? a própria query, indicando aonde procurar o documento, e as restrições
    let queryRef = query(collection(firestore, 'rest-casimiro'), queryConstrain)

    // ? uma Promise, a ser resolvida
    let queryPromise = getDocs(queryRef)

    let result: any = queryPromise
      .then(documents => {
        const len = documents.docs.length

        return len.toString()
      })
    
    const observable = from(result)
    return observable
  }

  itemCreationService(form: ItemCardapio): Observable<any> {
    let result = this._checkItemExistence(form).pipe(map(len => {
      // ? Se o resultado tiver alguma entrada, então ele já existe no menu
      if(len >= 1) {
        return 'exists'
      }else{
        // ? Não existe entrada, sete o Doc com as informações do form
        let docPromise = setDoc(doc(firestore, 'rest-casimiro', form.nome), form)

        // ? resolva, caso positivo
        let result = docPromise.then( () => {

          // ? emita aviso para atualizar a lista
          this.tellRefresh.emit()

          return 'ok'

          // ? emita o motivo da falha devido a conexão
        }, () => /*failure, internet*/ 'internet')

        const observable = from(result)
        return observable
      }
    }))
    
    return result
  }

  getItemList(): Observable<ItemCardapio[]> {
    // ? Pega todos os docs da coleção 'rest-casimiro' como um promise
    let queryPromise = getDocs(collection(firestore, 'rest-casimiro'))

    // ? Resolve o promise
    const querySnapshot = queryPromise.then((result) => {
      // ? Array a ser retornado
      let items: ItemCardapio[] = []

      // ? Dando push verbosamente, pois ele desconhece a semelhança dos tipos
      result.docs.forEach((values) => items.push({
        nome: values.data()['nome'],
        foto: values.data()['foto'],
        preco: values.data()['preco'],
        descricao: values.data()['descricao'],
        categoria: values.data()['categoria'],
      }))
      
      return items
    })

    // ? Retorna um observable enquanto a query não termina
    const observable = from(querySnapshot);
    return observable
  }

  categorias: string[] = []

  // ? checa a existência, retorna o documento a qual pertence?
  checkCategoryExistence(categoria: string): Observable<any> {

    let condicao = where('categoria', '==', categoria)

    let queryToRun = query(collection(firestore, 'rest-casimiro-cat'), condicao)

    let queryPromise = getDocs(queryToRun).then(docs => {

      if(docs.docs.length == 0){
        return false
      }else{
        return true
      }
    })

    const observable = from(queryPromise)
    return observable
  }

  addCategory(categoria: string): Observable<any> {
    // ? seta o Doc, passando o documento e o valor
    let docPromise = setDoc(doc(firestore, 'rest-casimiro-cat', categoria), {categoria: categoria})

    // ? recebe a promise
    let result = docPromise.then(() => true, () => false)

    // ? emite para que inscritos atualizem
    this.tellRefreshCats.emit()

    // ? retorna um observable
    return from(result)
  }

  getCategoryList(): Observable<any> {
    let docPromise = getDocs(collection(firestore, 'rest-casimiro-cat'))

    let promise = docPromise.then(docData => {
      let docs = docData.docs

      let arrret: string[] = []

      docs.forEach(doc => {
        // console.log(`putting doc.id ${doc.id}`)
        arrret.push(doc.id)
      })

      return arrret
    })

    return from(promise)
  }

}
