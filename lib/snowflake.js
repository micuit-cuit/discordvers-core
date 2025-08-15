require('json5/lib/register');
const processSTRList = require('../config/processList.json5');
const sequences = {};

function snowflake(processSTR) {
    //renvoie un id unique a la discorde (snowflake)
    // un id discord est composé de 4 parties:
    // - un timestamp de 42 bits, représentant le nombre de millisecondes écoulées depuis le 1er janvier 2015
    // - un identifiant unique de 10 bits pour le nœud (machine)
    // - un identifiant unique de 12 bits pour le nœud (processus)
    // - un compteur de séquence de 12 bits, commençant à un nombre aléatoire
    // https://discord.com/developers/docs/reference#snowflakes
    const timestamp = Date.now() - 1732924800000;
    const node = processSTRList[processSTR].node || 0;
    const process = processSTRList[processSTR].process || 0;

    if (!sequences[processSTR]) {
        sequences[processSTR] = { lastTimestamp: 0, sequence: 0 };
    }

    if (sequences[processSTR].lastTimestamp === timestamp) {
        // Même ms, on incrémente la séquence
        sequences[processSTR].sequence = (sequences[processSTR].sequence + 1) % 4096;
    } else {
        // Nouvelle ms, on reset la séquence
        sequences[processSTR].lastTimestamp = timestamp;
        sequences[processSTR].sequence = 0;
    }

    const sequence = sequences[processSTR].sequence;

    const timestampBin = timestamp.toString(2).padStart(42, '0');
    const nodeBin = node.toString(2).padStart(10, '0');
    const processBin = process.toString(2).padStart(12, '0');
    const sequenceBin = sequence.toString(2).padStart(12, '0');

    return {
        str: BigInt('0b' + timestampBin + nodeBin + processBin + sequenceBin).toString(36),
        bin: timestampBin + nodeBin + processBin + sequenceBin,
        raw: { timestamp, node, process, sequence }
    };
}
module.exports = snowflake;