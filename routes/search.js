const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const mixtapes = require('../models/mixtape');

router.use(bodyParser.urlencoded({ extended: true }));
const MAX_PREDICTIONS_COUNT = 5,
    dictionary = [{
        word: 'abba',
        weight: 100
    }, {
        word: 'abcd',
        weight: 90
    }, {
        word: 'abfe',
        weight: 80
    }, {
        word: 'abbb',
        weight: 110
    }, {
        word: 'abcf',
        weight: 70
    }, {
        word: 'abcg',
        weight: 120
    }, {
        word: 'accg',
        weight: 120
    }, {
        word: 'adcg',
        weight: 120
    }],
    map = {};
async function serverStart () {
    await mixtapes.find().then((results) => {
        results.forEach((mixtape) => {
            dictionary.push({ word: mixtape.name.toLowerCase(), weight: 100 })

        })
        console.log(dictionary)
        buildMap();
        //return res.status(200).send("Search ready.");
    }).catch((error) => {
        console.log(error);
        //return res.status(500).send("Error")
    })
}
function buildMap() {
    let item, pathArray;
    for (let i = 0; i < dictionary.length; i++) {
        item = dictionary[i];
        pathArray = item.word.split('');
        addItemToMap(map, pathArray, item.weight, i);
    };
};

function addItemToMap(mapNode, pathArray, weight, index) {
    let letter;

    if (pathArray && pathArray.length) {
        letter = pathArray.shift();

        if (mapNode[letter]) {
            managePredictions(mapNode[letter].predictions, index);
        } else {
            mapNode[letter] = {
                predictions: [index],
                children: {}
            }
        }
        addItemToMap(mapNode[letter].children, pathArray, weight, index);
    }
};

function managePredictions(predictions, index) {
    let insertionIndex = getInsertionIndex(predictions, index);

    predictions.splice(insertionIndex, 0, index);
    if (predictions.length > MAX_PREDICTIONS_COUNT) {
        predictions = predictions.splice(-1, 1);
    }
};

function getInsertionIndex(array, index) {
    let low = 0,
        high = array.length,
        middle;

    while (low < high) {
        middle = low + high >>> 1;
        if (dictionary[array[middle]].weight > dictionary[index].weight) {
            low = middle + 1;
        } else {
            high = middle;
        }
    }
    return low;
};

function predict(searchTerm) {
    let predictionObject = findPredictions(searchTerm.split(''), map),
        result = [];

    if (predictionObject) {
        for (let i = 0; i < predictionObject.predictions.length; i++) {
            result.push(dictionary[predictionObject.predictions[i]].word);
        };
        return result;
    }
};

function findPredictions(searchTermArray, object) {
    let pathArray,
        key;

    if (searchTermArray && searchTermArray.length) {
        key = searchTermArray.shift();
        if (object[key] && object[key].children && searchTermArray && searchTermArray.length) {
            return findPredictions(searchTermArray, object[key].children);
        } else {
            return object[key];
        }
    }
};

router.get('/:query', /*VerifyToken(),*/ async (req, res) => {
    let value = req.params.query;
    let predictions = predict(value) || [];
    return res.status(200).send(predictions);
});

serverStart();

module.exports = router;