const getTypeColor = type => {
    const normal = '#F5F5F5'
    return {
      normal,
      fire: '#FDDFDF',
      grass: '#DEFDE0',
      electric: '#FCF7DE',
      ice: '#DEF3FD',
      water: '#DEF3FD',
      ground: '#F4E7DA',
      rock: '#D5D5D4',
      fairy: '#FCEAFF',
      poison: '#98D7A5',
      bug: '#F8D5A3',
      ghost: '#CAC0F7',
      dragon: '#97B3E6',
      psychic: '#EAEDA1',
      fighting: '#E6E0D4'
    }[type] || normal
  }
  
  const getOnlyFulfilled = async ({func , arr}) => {
    const promise = arr.map(func)
    const responses = await Promise.allSettled(promise)
    return responses.filter(response => response.status === 'fulfilled')
  
  }
  
  const getPokemonsType = async pokeapiResults => {
  
  
  
    //Trata o status das urls - Apenas as cm status ok
    const fulfilled = await getOnlyFulfilled({arr: pokeapiResults, func:result => fetch(result.url)}) 
  
    //Pegando as urls
    const pokePromises = fulfilled.map(url => url.value.json())
  
    //Pegando as informações dos pokemons
    const pokemons = await Promise.all(pokePromises)
  
    //Retorna os tipos dos pokemons
    return pokemons.map(fulfilled => fulfilled.types.map(info => DOMPurify.sanitize(info.type.name)))
  
  }
  
  const getPokemonsIds =  pokeapiResults => pokeapiResults.map(({ url }) => {
      const urlsAsArray = DOMPurify.sanitize(url).split('/')
      return urlsAsArray[urlsAsArray.length - 2]
  })
  
  const getPokemonsImgs = async ids => {
  
    const fulfilled = await getOnlyFulfilled({arr:ids, func:id => fetch(`./assets/img/${id}.png`)})
    
    return fulfilled.map(response =>  response.value.url)
  }
  
  const paginationInfo = (() => {
    let limit = 15
    let offset = 0
  
  
    const getOffset = () => offset
    const getLimit = () => limit
    const incrementX = () => offset += limit
    return {incrementX , getOffset, getLimit}
  })()
  
  const getPokemons = async () => {
    try {
      //Faz a requisição para o site
      const { incrementX , getOffset, getLimit } = paginationInfo
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${getLimit()}&offset=${getOffset()}`)
  
      //Tratamento de erro
      if (!response.ok){
        throw new Error('Não foi possivel obter as informações')
      }
  
      //renomeia a variavel
      const { results:  pokeapiResults } = await response.json()
      const types = await getPokemonsType(pokeapiResults)
      const ids = getPokemonsIds(pokeapiResults)
      const imgs = await getPokemonsImgs(ids)
      const pokemons = ids.map((id , i) => ({id, name:pokeapiResults[i].name, types: types[i], imgUrl: imgs[i] }))
      
      incrementX()
  
      return pokemons
  
    } catch (error) {
      console.log('deu merda', error)
    }
  }
  
  const renderPokemons = pokemons => {
    const ul = document.querySelector('[data-js="pokemons-list"]')
    const fragment = document.createDocumentFragment()
    
    pokemons.forEach(({id , name , types , imgUrl}) => {
      const li = document.createElement('li')
      const img = document.createElement('img')
      const nameContainer = document.createElement('h2')
      const typeContainer = document.createElement('p')
      const [firstType] = types
  
      img.setAttribute('src' , imgUrl)
      img.setAttribute('alt' , name)
      img.setAttribute('class','card-image')
      
      li.setAttribute('class', `card ${firstType}`)
      li.style.setProperty('--type-color', getTypeColor(firstType))
  
      nameContainer.textContent = `${id}. ${name[0].toUpperCase()}${name.slice(1)}`
      typeContainer.textContent = types.length > 1 ? types.join(' | ') : firstType
      li.append(img,nameContainer,typeContainer)
  
      fragment.append(li)
  
    });
    ul.append(fragment)
  
  }
  
  const observeLastPokemon = pokemonObserver => {
    const lastPokemon = document.querySelector('[data-js="pokemons-list"]').lastChild
    pokemonObserver.observe(lastPokemon)
  }
  
  const handleNextPokemonsRender = () => {
    const pokemonObserver = new IntersectionObserver( async ([lastPokemon], observe) => {
      if(!lastPokemon.isIntersecting) {
        return
      }
  
      observe.unobserve(lastPokemon.target)
  
      if (paginationInfo.getOffset() === 150){
        return
      }
      const pokemons = await getPokemons()
      renderPokemons(pokemons)
      observeLastPokemon(pokemonObserver)
    }, {rootMargin:'500px'})
  
    observeLastPokemon(pokemonObserver)
  }
  
  const handlePageLoaded = async () => {
    const pokemons = await getPokemons()
    renderPokemons(pokemons)
    handleNextPokemonsRender()
  }
  
  handlePageLoaded()