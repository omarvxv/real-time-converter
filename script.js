class Application {
    constructor() {
        document.querySelectorAll('.input-block').forEach(input => input.addEventListener('input', (e) => this.input(e)));
        document.querySelector('.arrow').addEventListener('click', () => this.reverseCurrency());
        window.addEventListener('load', () => this.setInitValues());
    }
    setInitValues() {
        const currencies = new Currencies();
        this.data = new Data();
        currencies.generateList()
            .then(currencies => {
                let curList = '';
                document.querySelectorAll('.select').forEach(li => {
                    curList = currencies.cloneNode(true);
                    li.append(curList);
                });
            })
            .catch(err => { })
        this.calcContainer = document.querySelector('.convert');
        this.amount = 1;
        this.setIndex();
        this.addEventsToCurrencyLine();
        this.setCurrency();
        this.setAmount();
        this.setCalc();
    }
    addEventsToCurrencyLine() {
        document.querySelectorAll('.convert li').forEach(li => li.addEventListener('click', (e) => this.changeCurrency(e, li.parentNode)));
    }
    setCurrency() {
        const fromConverterBlock = this.calcContainer.children[this.blockIndex[0]];
        const toConverterBlock = this.calcContainer.children[this.blockIndex[1]];
        const fromLineElement = fromConverterBlock.querySelector('.active');
        const toLineElement = toConverterBlock.querySelector('.active');

        function getValue(element) {
            let value = '';
            if (element.children.length > 0) {
                value = element.children[0].value;
            } else {
                value = element.innerText;
            }
            return value;
        }
        this.fromCurrency = getValue(fromLineElement);
        this.toCurrency = getValue(toLineElement);
        this.setCurrencyLine();
    }

    setCurrencyLine() {
        const fromInfoLine = this.calcContainer.children[this.blockIndex[0]].querySelector('.value');
        const toInfoLine = this.calcContainer.children[this.blockIndex[1]].querySelector('.value');
        this.data.getData(this.fromCurrency, this.toCurrency)
            .then(data => {
                if(isNaN(data.rate)) data.rate = 1;
                fromInfoLine.innerHTML = `1 ${this.fromCurrency} = ${data.rate} ${this.toCurrency}`;
            })
            .catch(error => { })
        this.data.getData(this.toCurrency, this.fromCurrency)
            .then(data => {
                if(isNaN(data.rate)) data.rate = 1;
                toInfoLine.innerHTML = `1 ${this.toCurrency} = ${data.rate} ${this.fromCurrency}`;
            })
            .catch(err => { })
    }
    setAmount() {
        const amountBlock = this.calcContainer.children[this.blockIndex[0]];
        this.amount = amountBlock.querySelector('.input').value;
    }
    changeCurrency(e, curLine) {
        for (let i = 0; i < curLine.children.length; i++) {
            curLine.children[i].classList.remove('active');
        }
        e.currentTarget.className = 'active';
        const converterBlock = curLine.parentNode.parentNode;
        this.setIndex(converterBlock);
        this.setAmount();
        this.setCurrency();
        this.setCalc();
    }
    input(e) {
        if (e.data !== undefined && isNaN(e.data)) {
            e.target.value = this.correctInput(e.target.value);
            return;
        }
        if (e.target.tagName === 'INPUT') {
            if (this.timerId) {
                clearTimeout(this.timerId);
            }
            this.timerId = setTimeout(() => {
                this.amount = e.target.value;
                this.setIndex(e.currentTarget);
                this.setCalc();
            }, 800);
        }
    }
    correctInput(value) {
        let result = value.slice(0, -1);
        if ((value.endsWith(',') || value.endsWith('.')) && result.indexOf('.') < 0) {
            result += '.';
        }
        return result;
    }
    setIndex(section = '') {  // определение меняющегося курса на меняемый (блоками)
        if (section === '' || section.classList.contains('to')) this.blockIndex = [2, 0];
        else this.blockIndex = [0, 2];
        this.setCurrency();
    }
    setCalc() {
        const sectionFromValue = this.calcContainer.children[this.blockIndex[0]];
        const sectionToChange = this.calcContainer.children[this.blockIndex[1]];
        this.data.getData(this.fromCurrency, this.toCurrency)
            .then(data => {
                sectionFromValue.querySelector('.input').value = this.amount;
                if(isNaN(data.rate)) data.rate = 1;
                sectionToChange.querySelector('.input').value = this.amount * data.rate;
            })
            .catch(err => { })
    }
    reverseCurrency() {
        const sectionFrom = this.calcContainer.children[0].querySelector('.currency-line');
        const sectionTo = this.calcContainer.children[2].querySelector('.currency-line');
        const cloneFrom = sectionFrom.cloneNode(true);
        const cloneTo = sectionTo.cloneNode(true);
        cloneFrom.querySelector('select').selectedIndex = sectionFrom.querySelector('select').selectedIndex;
        cloneTo.querySelector('select').selectedIndex = sectionTo.querySelector('select').selectedIndex;
        sectionFrom.replaceWith(cloneTo);
        sectionTo.replaceWith(cloneFrom);
        this.blockIndex.reverse();
        this.setCalc();
        this.setCurrency();
        this.addEventsToCurrencyLine();
    }
}

class Currencies {
    generateList() {
        const list = document.createElement('select');
        list.name = "currency-list";
        const currencies = [];
        const curList = new Data();
        return curList.getData()
            .then(object => {
                for (let currency in object.rates) {
                    if (currency !== 'RUB' && currency !== 'USD' &&
                        currency !== 'EUR' && currency !== 'GBP')
                        currencies.push(currency);
                }
                currencies.forEach(currency => list.append(this.generateOption(currency)));
                return list;
            })
            .catch(err => { })
    }
    generateOption(currency) {
        const option = document.createElement('option');
        option.value = option.innerText = currency;
        return option;
    }
}

class Data {
    getData(fromCurrency, toCurrency) {
        let loadScreen = document.querySelector('.loading').style;
        let url = 'https://api.ratesapi.io/api/latest';
        if (fromCurrency && toCurrency) {
            if (fromCurrency === toCurrency) {
                return Promise.resolve({ rate: 1 });
            } else {
                url = `https://api.ratesapi.io/api/latest?base=${fromCurrency}&symbols=${toCurrency}`;
            }
        }
        loadScreen.display = 'flex';
        return fetch(url)
            .then(data => data.json())
            .then(baseCurrency => {
                return {
                    from: baseCurrency.base,
                    to: toCurrency,
                    rate: baseCurrency.rates[toCurrency],
                    rates: baseCurrency.rates
                }
            })
            .catch(error => {
                const errorLine = document.querySelector('.error').style;
                errorLine.display = 'block';
                setTimeout(() => errorLine.display = 'none', 1000);
                return error;
            })
            .finally(() => { loadScreen.display = 'none'; });
    }
}

new Application();