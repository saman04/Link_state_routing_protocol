let fs = require("file-system");
let prompt_f = require("readline-sync");
let prompt = prompt_f;
let uuidV4 = require("uuid/v4");
routers={};
    
   function main(){
        readfromfile();
        while (true) {
            console.log();
            let p = prompt.question("\nPlease Choose from:\nC to continue\nQ to quit\nP followed by the routers id number to print the routing table of a router\nS followed by the id number to shut down a router\nT followed by the id to start up a router:\n");
            if (p.toLowerCase() == "c") {
                for (let i = 0; i < 2; i++) {
                    for (let temp in this.routers) {
                        this.routers[temp].originatepacket();
                    }
                }
            }
            else if (p.toLowerCase() == "q") {
                break;
            }
            else if (p.charAt(0).toLowerCase() == "p") {
                if (routers[p.charAt(1)].status == "start") {
                    console.log(routers[p.charAt(1)].routingtable);
                }
                else {
                    console.log(p + " is shutdown now");
                }
            }
            else if (p.charAt(0).toLowerCase() == "s") {
                routers[p.charAt(1)].status = "stop";
            }
            else if (p.charAt(0).toLowerCase() == "t") {
                routers[p.charAt(1)].status = "start";
            }
        }
    }
    function readfromfile(){
        let input = fs.readFileSync("infile.dat", "utf8");
        let arr = input.split("\n");
        let newrouter;
        for (let i in arr) {
            let inline = arr[i].split(/\s+/);
            if (inline[0] !== '') {
                newrouter = new router();
                newrouter.id = inline[0];
                newrouter.network = inline[1];
                if (inline[2] != undefined) {
                    newrouter.nwcost = inline[2];
                }
                else {
                    newrouter.nwcost = 0;
                }
                this.routers[newrouter.id] = newrouter;
            }
            else {
                if (inline[2] != undefined) {
                    this.routers[newrouter.id].connectedrouterslis[inline[1]] = inline[2];
                }
                else {
                    this.routers[newrouter.id].connectedrouterslis[inline[1]] = 1;
                }
            }
        }
    }
 class lsp{
     constructor() {
        this.id = uuidV4();
        this.routerid = null;
        this.sequence = null;
        this.TTL = 10;
        this.list = null;
        this.sendfrom = null;
    }
 }

class router{
    constructor() {
        this.TICK_CHECK = 1;
        this.id = null;
        this.status = "start";
        this.network = null;
        this.nwcost = null;
        this.tick = 0;
        this.connectedrouterslis = {};
        this.packetcopy = null;
        this.oripacket = null;
        this.sequence = 0;
        this.recievedlis = {};
        this.ohsr_list = {};
        this.adjlist = {};
        this.nwmapping = {};
        this.routingtable = {};
        let spf;
    }
    receivepacket (packet) {
        if (this.status === "start") {
            packet.TTL = packet.TTL - 1;
            if (!this.checkTTL(packet)) {
                this.updatelsp(packet);
                this.spf=new DSP();
                this.spf.init(this.id, this.adjlist);
                this.spf.computespf();
                this.updateroutingtable();
                for (let temp in this.connectedrouterslis) {
                    let newpack = this.copyPacket(packet);
                    newpack.sendfrom = this.id;
                    if (routers[temp].receivepacket(newpack) == true) {
                        if (this.recievedlis[this.tick] == undefined) {
                            this.recievedlis[this.tick] = {};
                        }
                        this.recievedlis[this.tick][temp] = 1;
                    }
                  
                }
            }
            else{
            }
            return true;
        }
        else {
            return false;
        }
    }
   originatepacket() {
        if (this.status === "start") {
            this.generatelsr();
            this.tick = this.tick + 1;
            this.recievedlis[this.tick] = {};
            for (let temp in this.connectedrouterslis) {
                let newpack = this.copyPacket(this.oripacket);
                newpack.sendfrom = this.id;
                if (routers[temp].receivepacket(newpack) == true) {
                    this.recievedlis[this.tick][temp] = 1;
                }
            }
            if (this.tick >= this.TICK_CHECK) {
                this.checkTicks();
            }
        }
        console.log(routers[3].connectedrouterslis);
    }
    generatelsr() {
        this.sequence = this.sequence + 1;
        this.oripacket = new lsp();
        this.oripacket.routerid = this.id;
        this.oripacket.sequence = this.sequence;
        this.oripacket.list = {};
        this.oripacket.TTL = 10;
        for (let temp in this.connectedrouterslis) {
            this.oripacket.list[temp] = {};
            this.oripacket.list[temp].cost = this.connectedrouterslis[temp];
            this.oripacket.list[temp].network = routers[temp].network;
        }
    }
    checkTicks () {
        for (let temp in this.connectedrouterslis) {
            if (this.recievedlis[this.tick][temp] == undefined && this.recievedlis[this.tick - 1][temp] == undefined) {
                this.setcosttoinfinite(temp);
            }
            if (this.recievedlis[this.tick][temp] != undefined) {
                this.connectedrouterslis[temp] = 1;
                if (this.connectedrouterslis[temp] == Number.MAX_VALUE) {
                    this.connectedrouterslis[temp] = routers[temp].connectedrouterslis[this.id];
                }
            }
        }
    }
    setcosttoinfinite(routerid) {
        this.connectedrouterslis[routerid] = Number.MAX_VALUE;
    }
    checkTTL (packet) {
        if (packet.TTL <= 0) {
            return true;
        }
        if (this.ohsr_list[packet.routerid] == null) {
            this.ohsr_list[packet.routerid] = packet.sequence;
        }
        else {
            if (this.ohsr_list[packet.routerid] >= packet.sequence) {
                return true;
            }
        }
        return false;
    }
    updatelsp(packet) {
        for (let i in packet.list) {
            if (this.adjlist[packet.routerid] == null) {
                this.adjlist[packet.routerid] = {};
            }
            if (this.adjlist[i] == null) {
                this.adjlist[i] = {};
            }
            this.adjlist[packet.routerid][i] = packet.list[i].cost;
            this.adjlist[i][packet.routerid] = packet.list[i].cost;
            this.nwmapping[i] = packet.list[i].network;
        }
    }
    updateroutingtable () {
        for (let i in this.spf.D) {
            if (this.routingtable[routers[i].network] == undefined) {
                this.routingtable[routers[i].network] = {};
            }
            if (typeof this.spf.D[i] != "number") {
                this.spf.D[i] = parseInt(this.spf.DSP.D[i]);
            }
            if (typeof routers[i].nwcost != "number") {
                routers[i].nwcost = parseInt(routers[i].nwcost);
            }
            this.routingtable[routers[i].network].cost = this.spf.D[i] + routers[i].nwcost;
            this.routingtable[routers[i].network].outgoinglink = this.spf.outgoinglink[i][1];
            this.routingtable[this.network] = {};
            if (typeof this.nwcost == "number") {
                this.routingtable[this.network].cost = this.nwcost;
            }
            else {
                this.routingtable[this.network].cost = parseInt(this.nwcost);
            }
            this.routingtable[this.network].outgoinglink = null;
        }
    }
   copyPacket(packet) {
        let newpack = new lsp();
        for (let i in packet) {
            newpack[i] = packet[i];
        }
        return newpack;
    }
}
//https://www.geeksforgeeks.org/dijkstras-algorithm-for-adjacency-list-representation-greedy-algo-8/ This algoritm is referred from this site to understand the approach to find the shortest path using dijkstra's algorithm.
class DSP{
    constructor(){
        this.adjlist = {};
        this.selected = {}; 
        this.visited = {};
        this.D = {};
        this.outgoinglink = {};
    }
    init (s, adjlist) {
        this.s = s;
        this.adjlist = adjlist;
        this.selected = {};
        this.visited = {};
        this.D = {};
        this.outgoinglink = {};
        for (let i in this.adjlist) {
            if (i == s) {
                this.selected[i] = 1;
            }
            else {
                this.visited[i] = 1;
                if (this.adjlist[s] != undefined) {
                    if (this.adjlist[s][i] == undefined) {
                        this.D[i] = Number.MAX_VALUE;
                    }
                    else {
                        if (typeof this.adjlist[s][i] == "number") {
                            this.D[i] = this.adjlist[s][i];
                        }
                        else {
                            this.D[i] = parseInt(this.adjlist[s][i]);
                        }
                    }
                    this.outgoinglink[i] = [s, i];
                }
            }
        }
    }
    computespf () {
        if (Object.getOwnPropertyNames(this.D).length != 0) {
            while (Object.getOwnPropertyNames(this.visited).length != 0) {
                let v = this.mindisfromvisited();
                delete this.visited[v];
                this.selected[v] = 1;
                for (let w in this.visited) {
                    let costvw;
                    if (this.adjlist[v] == undefined) {
                        costvw = Number.MAX_VALUE;
                    }
                    else {
                        if (this.adjlist[v][w] == undefined) {
                            costvw = Number.MAX_VALUE;
                        }
                        else {
                            if (typeof this.adjlist[v][w] == "number") {
                                costvw = this.adjlist[v][w];
                            }
                            else {
                                costvw = parseInt(this.adjlist[v][w]);
                            }
                        }
                    }
                    if (typeof this.D[w] != "number") {
                        this.D[w] = parseInt(this.D[w]);
                    }
                    if (typeof this.D[v] != "number") {
                        this.D[v] = parseInt(this.D[v]);
                    }
                    if (this.D[v] + costvw < this.D[w]) {
                        this.outgoinglink[w] = [];
                        for (let j = 0; j < this.outgoinglink[v].length; j++) {
                            this.outgoinglink[w].push(this.outgoinglink[v][j]);
                        }
                        this.outgoinglink[w].push(w);
                    }
                    this.D[w] = Math.min(this.D[w], this.D[v] + costvw);
                }
            }
        }
    }
    mindisfromvisited () {
        let minvec = null;
        for (let i in this.visited) {
            if (minvec == null) {
                minvec = i;
            }
            else {
                if (typeof this.D[i] != "number") {
                    this.D[i] = parseInt(this.D[i]);
                }
                if (typeof this.D[minvec] != "number") {
                    this.D[minvec] = parseInt(this.D[minvec]);
                }
                if (this.D[i] < this.D[minvec]) {
                    minvec = i;
                }
            }
        }
        return minvec;
    }
    
}

main();