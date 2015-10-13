function $()
{
    return document.getElementById(arguments[0]);
}


function lpad(n, z)
{
    for (var str = '' + n, i = str.length; i < z; i++) {
        str = '0' + str;
    }

    return str;
}


var SM_NULL     = 0x000;
var SM_WALL     = 0x01 << 1; // OPT_BACKGROUND|OPT_SOLID
var SM_PLAYER   = 0x01 << 2; // OPT_PLAYER
var SM_BOX      = 0x01 << 3; // OPT_SOLID|OPT_MOVABLE
var SM_BASE     = 0x01 << 4; // OPT_BACKGROUND

var SD_FORWARD  = 0x01;
var SD_BACKWARD = 0x02;
var SD_LEFT     = 0x03;
var SD_RIGHT    = 0x04;


function Sokoban()
{
    this.grid_width       = 0;
    this.grid_height      = 0;
    this.grid_code        = null;
    this.grid             = [];
    this.player_location  = null;
    this.player_direction = SD_FORWARD;
    this.base_count       = null;
    this.moves            = 0;
    this.pushes           = 0;
    this.start_time       = null;
    this.end_time         = null;
    this.timer            = null;
    this.grid_size        = null;
    this.undo             = null;

    // Fixme
    if (window.sb_timer) {
        clearInterval(window.sb_timer);
    }

    window.sb_timer = null;
}


Sokoban.prototype.get_grid_id = function(k)
{
    var kw = Math.floor(k / this.grid_width);
    return 'grid-' + kw + '-' + (k - (kw * this.grid_width));
}


Sokoban.prototype.grid_ntoc = function(n)
{
    var c0 = Math.floor(n / this.grid_width);
    return [c0, (n - (c0 * this.grid_width))];
}


Sokoban.prototype.grid_cton = function(c)
{
    return (c[0] * this.grid_width) + c[1];
}


Sokoban.prototype.render_grid = function()
{
    if (this.grid_code != null) {
        this.unmap_grid();
        this.grid_code = null;
    }

    var tmp = '<div id="grid">';

    for (var i = 0; i < this.grid_height; i++) {
        tmp += '<div class="grid-row">\n\n';

        for (var j = 0; j < this.grid_width; j++) {
            tmp += '<div id="grid-' + i + '-' + j + '"></div>';
        }

        tmp += '</div>\n\n';
    }

    tmp += '</div><div id="info"><span id="map">00</span> <span id="moves">moves: 0000</span> '
        + '<span id="pushes">pushes: 0000</span> '
        + '<span id="time">time: 00:00:00</span>'
        + '</div>';

    $('game').innerHTML = tmp;
    $('game').style.width  = (this.grid_width * 32) + 'px';
    this.render_grid_objects();
}


Sokoban.prototype.render_grid_objects = function()
{
    for (var k = 0; k < this.grid_size; k++) {
        try {
            this.render_grid_object(k);
        }
        catch(e) {
            alert(k + '\n' + this.get_grid_id(k) + '\n' + e);
            break;
        }
    }
}


Sokoban.prototype.render_grid_object = function(k)
{
    if (this.grid[k] & SM_PLAYER) {
        switch(this.player_direction) {
            case SD_LEFT:     $(this.get_grid_id(k)).innerHTML = '<img src="media/sokoban-left.png" alt="" />'; break;
            case SD_RIGHT:    $(this.get_grid_id(k)).innerHTML = '<img src="media/sokoban-right.png" alt="" />'; break;
            case SD_FORWARD:  $(this.get_grid_id(k)).innerHTML = '<img src="media/sokoban-forward.png" alt="" />'; break;
            case SD_BACKWARD: $(this.get_grid_id(k)).innerHTML = '<img src="media/sokoban-backward.png" alt="" />'; break;
        }
    }
    else if (this.grid[k] & SM_BOX) {
        $(this.get_grid_id(k)).innerHTML = '<img src="media/sokoban-box-' + (this.grid[k] & SM_BASE ? '1' : '0') + '.png" alt="" />';
    }
    else if (this.grid[k] & SM_BASE) {
        $(this.get_grid_id(k)).innerHTML = '<img src="media/sokoban-base.png" alt="" />';
    }
    else if (this.grid[k] & SM_WALL) {
        $(this.get_grid_id(k)).innerHTML = '<img src="media/sokoban-wall.png" alt="" />';
    }
    else {
        $(this.get_grid_id(k)).innerHTML = '';
    }
}


Sokoban.prototype.init_player_location = function(k, direction)
{
    if (this.player_location == null) {
        this.grid[k]        = SM_PLAYER;
        this.player_location  = k;
        this.player_direction = direction;
    }
    else {
        this.grid[k] = SM_NULL;
    }
}


Sokoban.prototype.update_moves = function()
{
    if (this.moves == 0) {
        this.start_time  = new Date().getTime() - 500;
        this.end_time    = null;
        var __timer_hack = this;
        window.sb_timer  = setInterval(function() {__timer_hack.update_time();}, '500');
    }

    this.moves++;
    $( 'moves' ).innerHTML = 'moves: ' + lpad(this.moves, 4);
}


Sokoban.prototype.update_pushes = function()
{
    this.pushes++;
    $('pushes').innerHTML = 'pushes: ' + lpad(this.pushes, 4);
}


Sokoban.prototype.update_time = function()
{
    var len = 0;

    if (this.end_time != null) {
        len = this.end_time - this.start_time;
    }
    else {
        len = new Date().getTime() - this.start_time;
    }

    len = Math.floor(len / 1000);

    var hrs = Math.floor(len / 3600);
    len -= hrs * 3600;
    var min = Math.floor(len / 60);
    len -= min * 60;

    $('time').innerHTML = 'time: ' + lpad(hrs, 2) + ':' + lpad(min, 2) + ':' + lpad(len, 2);
}


Sokoban.prototype.unmap_grid = function()
{
    this.base_count = 0;
    this.grid_size  = this.grid_width * this.grid_height;

    for (var k = 0; k < this.grid_size; k++) {
        switch(this.grid_code.substr(k, 1)) {
            case 'X': this.grid[k] = SM_WALL; break;
            case '0': this.grid[k] = SM_BOX; break;
            case '1': this.grid[k] = SM_BOX | SM_BASE; this.base_count++; break;
            case '#': this.grid[k] = SM_BASE; this.base_count++; break;
            case 'F': this.init_player_location(k, SD_FORWARD); break;
            case 'B': this.init_player_location(k, SD_BACKWARD); break;
            case 'L': this.init_player_location(k, SD_LEFT); break;
            case 'R': this.init_player_location(k, SD_RIGHT); break;
            default:  this.grid[k] = SM_NULL; break;
        }
    }
}


Sokoban.prototype.validate_push = function(m, m_co)
{
    if (this.grid[m] & SM_WALL
     || this.grid[m] & SM_BOX) {
        return false;
    }

    if (m_co[0] < 0
     || m_co[0] >= this.grid_height
     || m_co[1] < 0
     || m_co[1] >= this.grid_width) {
        return false;
    }

    return true;
}


Sokoban.prototype.validate_move = function(direction)
{
    if (this.player_location == null
     || this.end_time != null) {
        return false;
    }

    var k    = this.player_location;
    var k_co = this.grid_ntoc(k);
    var m_co = this.modify_coords([k_co[0], k_co[1]], direction);
    var m    = this.grid_cton(m_co);
    var egc  = 0;
    var undo = [null, null, this.player_direction];

    this.player_direction = direction;

    if (m_co[0] < 0
     || m_co[0] >= this.grid_height
     || m_co[1] < 0
     || m_co[1] >= this.grid_width) {
        return false;
    }

    if (!(this.grid[m] & SM_WALL)) {
        if (this.grid[m] & SM_BOX) {
            var p_co = this.modify_coords(m_co, direction),
                p    = this.grid_cton(p_co);

            if (this.validate_push(p, p_co)) {
                undo[1] = [m, p];
                this.grid[m] ^= SM_BOX;
                this.grid[p] |= SM_BOX;
                egc++;
                this.update_pushes();
                this.render_grid_object(m);
                this.render_grid_object(p);
            }
        }

        if (!(this.grid[m] & SM_BOX)) {
            undo[0] = [k, m];

            this.grid[k]         ^= SM_PLAYER;
            this.grid[m]         |= SM_PLAYER;
            this.player_location  = m;
            egc++;
            this.update_moves();
            this.render_grid_object(k);
            this.render_grid_object(m);
        }

        if (undo[0] != null) {
            this.undo = undo;
        }
    }
    else {
        this.render_grid_object(k);
    }

    //this.render_grid_objects();

    if (egc >= 2) {
        for (var k = 0, egc = 1; k < this.grid_size; k++) {
            if (this.grid[k] & SM_BOX
             && !(this.grid[k] & SM_BASE)) {
                egc = 0;
                break;
            }
        }

        if (egc == 1) {
            this.end_time = new Date().getTime();
            clearInterval(window.sb_timer);
            window.sb_timer = null;
            this.update_time();
        }
    }
}


Sokoban.prototype.undo_move = function()
{
    if (this.undo == null)
        return;

    if (this.undo[2] != null) {
        this.player_direction = this.undo[2];
    }

    if (this.undo[0] != null) {
        var k = this.undo[0][0],
            m = this.undo[0][1];

        this.grid[k]         |= SM_PLAYER;
        this.grid[m]         ^= SM_PLAYER;
        this.player_location  = k;
        this.update_moves();
        this.render_grid_object(k);
        this.render_grid_object(m);
    }

    if (this.undo[1] != null) {
        var m = this.undo[1][0],
            p = this.undo[1][1];

        this.grid[m] |= SM_BOX;
        this.grid[p] ^= SM_BOX;
        this.render_grid_object(m);
        this.render_grid_object(p);
    }

    this.undo = null;
}


Sokoban.prototype.modify_coords = function(coords, direction)
{
    switch (direction) {
        case SD_LEFT:     coords[1]--; break;
        case SD_RIGHT:    coords[1]++; break;
        case SD_FORWARD:  coords[0]--; break;
        case SD_BACKWARD: coords[0]++; break;
    }

    return coords;
}


/**
 * These are the original maps, extracted from the DOS Sokoban game
*/
var sb_maps =
[
/*1*/'                                                             XXXXX              X   X              X0  X            XXX  0XX           X  0 0 X         XXX X XX X   XXXXXXX   X XX XXXXX  ##XX 0  0          ##XXXXXX XXX XFXX  ##X    X     XXXXXXXXX    XXXXXXX                                              ',
/*2*/'                                                                               XXXXXXXXXXXX       X##  X     XXX     X##  X 0  0  X     X##  X0XXXX  X     X##    F XX  X     X##  X X  0 XX     XXXXXX XX0 0 X       X 0  0 0 0 X       X    X     X       XXXXXXXXXXXX                                        ',
/*3*/'                                                                                     XXXXXXXX           X     FX           X 0X0 XX           X 0  0X            XX0 0 X    XXXXXXXXX 0 X XXX  X####  XX 0  0  X  XX###    0  0   X  X####  XXXXXXXXXX  XXXXXXXX                                                ',
/*4*/'                              XXXXXXXX           X  ####XXXXXXXXXXXXX  ####XX    X  0 0   ####XX 000X0  0 X  ####XX  0     0 X  ####XX 00 X0 0 0XXXXXXXXX  0 X     X       XX XXXXXXXXX       X    X    XX       X     0   XX       X  00X00  FX       X    X    XX       XXXXXXXXXXX                           ',
/*5*/'                                               XXXXX              X   XXXXX          X X0XX  X          X     0 X  XXXXXXXXX XXX   X  X####  XX 0  0XXX  X####    0 00 XX   X####  XX0  0 FX   XXXXXXXXX  0  XX           X 0 0  X           XXX XX X             X    X             XXXXXX                     ',
/*6*/'                                                             XXXXXX  XXX        X##  X XXFXX       X##  XXX   X       X##     00 X       X##  X X 0 X       X##XXX X 0 X       XXXX 0 X0  X          X  0X 0 X          X 0  0  X          X  XX   X          XXXXXXXXX                                         ',
/*7*/'                                                                    XXXXX        XXXXXXX   XX      XX X FXX 00 X      X    0      X      X  0  XXX   X      XXX XXXXX0XXX      X 0  XXX ##X       X 0 0 0 ###X       X    XXX###X       X 00 X X###X       X  XXX XXXXX       XXXX                              ',
/*8*/'    XXXX               X  XXXXXXXXXXX     X    0   0 0 X     X 0X 0 X  0  X     X  0 0  X    X   XXX 0X X  XXXX X   XFX0 0 0  XX   X   X    0 X0X   X X   X   0    0 0 0 X    XXXX  XXXXXXXXX     X      X           X      X           X######X           X######X           X######X           XXXXXXXX       ',
/*9*/'                              XXXXXXX            X  ###X        XXXXX  ###X        X      # #X        X  XX  ###X        XX XX  ###X       XXX XXXXXXXX       X 000 XX       XXXXX  0 0 XXXXX  XX   X0 0   X   X  XF 0  0    0  0 X  XXXXXX 00 0 XXXXX       X      X           XXXXXXXX                        ',
/*10*/' XXX  XXXXXXXXXXXXXXXFXXXX       X   XX 00   00  0 0 ###XX  000X    0  X###XX 0   X 00 00 X###XXXX   X  0    X###XX     X 0 0 0 X###XX    XXXXXX XXX###XXX X  X  0 0  X###XX  XX X 00 0 0XX##XX ##X X  0      X#XX ##X X 000 000 X#XXXXXX X       X X#X    X XXXXXXXXX X#X    X           X#X    XXXXXXXXXXXXXXX',
/*11*/'                             XXXX          XXXX X  X        XXX  XXX0 X       XX   F  0  X      XX  0 00XX XX      X  X0XX     X      X X 0 00 X XXX     X   0 X  X 0 XXXXXXXXX    X  00 X   XXXXX XX 0         XX#    XXX  XXXXXXXXX## ##X XXXX       X###X#X            X#####X            XXXXXXX            ',
/*12*/'                                       XXXXXXXXXXXXXXXX   X              X   X X XXXXXX     X   X X  0 0 0 0X  X   X X   0F0   XX XX  X X X0 0 0XXX###X  X X   0 0  XX###X  X XXX000 0 XX###X  X     X XX XX###X  XXXXX   XX XX###X      XXXXX     XXX          X     X            XXXXXXX                      ',
/*13*/'                      XXXXXXXXX         XX   XX  XXXXX   XXX     X  X    XXXX  0 X0 X  X  ### XX X 0XF0XX X X#X# XX  X X0  X    # # XX 0    0 X X X#X# XX   XX  XX0 0 # # XX 0 X   X  X0X#X# XXX 0  0   0  0### X X0 XXXXXX    XX  X X  X    XXXXXXXXXX XXXX                                                    ',
/*14*/'        XXXXXXX      XXXXXXX     X      X     X 0F0 X      X00 X   XXXXXXXXX  X XXX######XX   X  X   0######XX X X  X XXX######     X XX   XXXX XXX X0XX X  X0   X  0  X X  X  0 000  X 0XX X  X   0 0 XXX00 X X  XXXXX     0   X X      XXX XXX   X X        X     X   X        XXXXXXXX  X               XXXX ',
/*15*/'     XXXXXXX           X   X  X           X  0   X         XXX X0   XXXX      X  0  XX0   X      X  X F 0 X 0X      X  X      0 XXXX   XX XXXX0XX     X   X 0X#####X X   X   X  0##11# 0X XXX  XX  X#####X   X    X   XXX XXXXXXX    X 00  X  X         X  X     X         XXXXXX   X              XXXXX        ',
/*16*/'  XXXXX              X   XX             X    X  XXXX       X 0  XXXX  X       X  00 0   0X       XXXF X0    XX       X  XX  0 0 XX      X 0  XX XX #X      X  X0XX0  X#X      XXX   0##XX#X       X    X#1###X       X 00 X#####X       X  XXXXXXXXX       X  X               XXXX                              ',
/*17*/'                        XXXXXXXXXX         X##  X   X         X##      X         X##  X  XXXX      XXXXXXX  X  XX     X            X     X  X  XX  X  X   XXXX XX  XXXX XX   X  0  XXXXX X  X   X X 0  0  X 0  X   X F0  0   X   XX   XXXX XX XXXXXXX       X    X             XXXXXX                           ',
/*18*/'                        XXXXXXXXXXX        X  #  X   X        X X#    F X    XXXXX XX##X XXXX  XX  X ##XXX     XXXX 0 X###   0 X  0 XX    ## XX  XX XX XXXXX0XX0X 0 X   X X  XX X    X0 00 X X  X  0 X X  X 0XX X  X               X  X  XXXXXXXXXXX  X  XXXX         XXXX                                      ',
/*19*/'  XXXXXX             X   FXXXX        XXXXX 0   X        X   XX    XXXX     X 0 X  XX    X     X 0 X  XXXXX X     XX 0  0    X X     XX 0 0 XXX X X     XX X  0  X X X     XX X X0X   X X     XX XXX   X X XXXXXXX  0  XXXX X X####XX    0    0   ##X#XXXXX0  0X 0   ####XX       X  XX ####XXXXXXXXXXXXXXXXXXXX',
/*20*/'    XXXXXXXXXX     XXXXX        XXXX  X     X   0  XF X  X XXXXXXX0XXXX  XXXX X    XX X  X0 ##XX X 0  0  X  X  X#XX X 0  X     X0 ##XX X  XXX XX     X#XX XXX  X  X  X0 ##XX X    X 0XXXX  X#XX X0   0  0  X1 ##XX    0 X 0 0 X  X#XXXXX 0XXX    X1 ##X   X    00 XXX####X   X      XX XXXXXX   XXXXXXXX        ',
/*21*/'  XXXXXXXXX          X       X          X       XXXX       XX XXXX X  X       XX XFXX    X       X 000 0  00X       X  X XX 0  X       X  X XX  0 XXXX    XXXX  000 0X  X     X   XX   ####X     X X   X X## #X     X   X X XX###X     XXXXX 0  X###X         XX   XXXXX          XXXXX                         ',
/*22*/'XXXXX      XXXX    X    XXXXXXX  XXXXXX   0X  X  0  X   XX  0  0  0 X 0 0  XXX0 0   X FX 0    XX  0 XXXXXXXXXXX XXX X   X#######X 0X X XX  X ######X  X X X   0########0 X X X 0 X#### ##X  X X  0 0XXXX0XXXX 0X X 0   XXX 0   0  XXX 0     0 0  0    XXX XXXXXX 0 XXXXX XX         X       XXXXXXXXXXXXXXXXXXXX',
/*23*/'                       XXXXXXX            X  X  XXXX     XXXXX 0X0 X  XX    X## X  X  X   X    X## X 0X0 X  0XXXX X#  X     X0  X  X X##   0X  X 0    X X##FX  X0 X0  X  X X## X 0X     0X  X X## X  X00X0  X  XXX## X 0X  X  0X0  XX## X  X  X   X   XXX# XXXX  XXXXX   X XXXX  XXXX   XXXXX                   ',
/*24*/'XXXXXXXXXXXXXXX    X##########  #XXXX X##########00#X  X XXXXXXXXXXX0 X   XXX      0  0     0 XXX XXXX   X  0 X  XX      X   XX  X XXX  0X  X XX  XXX XXX 0 X0XXX    XXX XXXXX  0 X  X  XXX XXXXX    0 XX X  X XX X 0  X  0  0 0   X X  0  0X000  X   X X  X  0      XXXXX X FXX  X  X  X     XXXXXXXXXXXXXX    ',
/*25*/'XXXX               X  XXXXXXXXXXXXXX  X  X   ##X######X  X  X X XXXXX ###X  XX0X    ########X  X   XX0XXXXXX  XXXXX 0 X     XXXXXXF XXX0 X 0   XXXXXX  XX  0 X000XX       XX      X    X0X0XXXX XXXX X00000    X X X    0     X   X X X   XX XX     XXXX XXXXXX0XXXXXX 0 XX        X    X   XXXXXXXXXXX    XXXXX',
/*26*/'                                                             XXXXXXX            X  X  XXXXX       XX  X  X###XXX     X  0X  X###  X     X 0 X00 ###  X     X  0X  X### #X     X   X 0XXXXXXXX    XX0       0 0 X    XX  X  00 X   X     XXXXXX  XX00FX          X      XX          XXXXXXXX                     ',
/*27*/'                    XXXXXXXXXXXXXXXXX  X###   X    X   XXXX#####  0XX X X0 XX######X  0  X    XX######X  X  X X  XXXXXXXXXX 0  0 0  X  X     X0XX0 XX0XX XX   0    X 0    X X  XX XXX X  XX0 X X 0 00     0  0  X X 0    0XX0 XXXXXX XXXXXXX  F XX            XXXXXX                                            ',
/*28*/'          XXXXX          XXXXX   X         XX 0  0  XXXX  XXXXX 0  0 0 XX#X  X       00  XX##X  X  XXXXXX XXX## X  XX X  X    X### X  X 0   X    X### X  XF X0 XX XXXX###X  XXXX  0 00  XX##X     XX  0 0  0###X      X 00  0 X  #X      X   0 0  XXXX      XXXXXX   X              XXXXX                       ',
/*29*/'                   XXXXX              X   XX             X 0  XXXXXXXXX     XX X X       XXXXXXXX X   0X0XF  X   XX  X      0 X   0 XX  XXX XXXXXXXXX XXX  XX ##1##### X XXXX XX 1#1##1#1 X XXX 0XXXXXXXXXX XX0 XX  0   0  0    0  XX  X   X   X   X  XXXXXXXXXXXXXXXXXXXX                                      ',
/*30*/'                          XXXXXXXXXXX        X   X     X XXXXX  X     0 0 X X   XXXXX 0XX X XX X 0 XX   X XX 0  X X 0  F00 X XX000 X XX XXX   X XX    X XX X   XXX XXXXX0X XX X     0  X####X X  XXX XX 0 X####XXX 0   0 X   X##0# XX  XX 0 X  XX#### XXXXXX   XXXXXX###XX    XXXXX    XXXXX                    ',
/*31*/'   XXXX               X  XXXXXXXXX      XX  XX  X   X      X  0X 0F0   XXXX   X0  0  X 0 0X  XX XX  0XX X0 0     X X  X  X X   000  X X 0    0  0XX XXXX X 0 0 X0X  X  X    XX  XXX  XXX0 X     X  X####     X     XXXX######XXXX       X####XXXX          X###XX             X###X              XXXXX          ',
/*32*/'                            XXXX           XXXXX  X          XX     0X         XX 0  XX XXX       XF0 0 X 0  X       XXXX XX   0X        X####X0 0 X        X####X   0X        X####  00 XX       X### X 0   X       XXXXXX0 0  X            X   XXX            X0 XXX             X  X               XXXX      ',
/*33*/'                      XXXXXXXXXXXX       XX     XX  X       XX   0   0 X       XXXX XX 00 X       X   0 X    X       X 000 X XXXX       X   X X 0 XX       X  X  X  0 X       X 0X 0X    X       X   ##X XXXX       XXXX## 0 XFX       X#####X 0X X       XX####X  0 X       XXX##XX    X       XXXXXXXXXXXX    ',
/*34*/'                       XXXXXXXXX          X####   XX         X#X#X  0 XX       XX####X X FXX      X ####X  X  XX     X     X0 XX0 X     XX XXX  0    X      X0  0 0 0X  X      X X  0 0 XX X      X  XXX  XX  X      X    XX XX XX      X  0 X  0  X       XXX0 0   XXX         X  XXXXX           XXXX         ',
/*35*/'XXXXXXXXXXXX XXXXXXX   X    X XXX####XX   00X   F  #####XX   X XXX   X ####XXX XX XXX  X  ####X X 0 0     X X XXXX X  0 0XX  X      XXXXX X  XXXX X XX XX  X X0   XX X    XX 0  0  X XX X   XXX X 0 0    X X   X X  0 XX XX X XXXXX X 00     00  X     XX XX XXX 0  X      X    X X    X      XXXXXX XXXXXX     ',
/*36*/'            XXXXX  XXXXX  XXXXXX   X  X   XXXX  0 0 0 X  X 0   XX XX XX  XX X   0 0     0  0 X XXX 0  XX XX     XX  X XXXXX XXXXX00 X XX0XXXXX FXX     X X 0  XXX0XXX 0  XX X 0  X   XXX  XXX  X 00 0 X   00 X    X     X   XX  X    XXXXXXX## #XXX        X#########X        X#########X        XXXXXXXXXXX    ',
/*37*/'XXXXXXXXXXX        X######   XXXXXXXXXX######   X  XX   XX##XXX 0    0     XX### 0 0 X  XXX   XX###X0XXXXX    X  XXXX    X   X0  X0 X  X  00 0 0  0XX  X  X  0   X0X0 XX0 X  XXX XX X    XX  X   X  0 0 XX XXXXXX   X    0  0  X       XX   X X   X        XXXXXFXXXXX            XXX                           ',
/*38*/'                                                XXXX         XXXXXXX FX         X     0  X         X   0XX 0X         XX0X###X X          X 0###  X          X X# #X XX         X   X X0 X         X0  0    X         X  XXXXXXX         XXXX                                                                   ',
/*39*/'             XXXXXX XXXXXXXXXXXXX####XXX   XX     XX####XX  00XX  0 FXX####XX      00 0X  ####XX  0 XX 00 X X ###XX  0 XX 0  X  ####XXX XXXXX XXX XX#XXXXX   0  0 XX   #  XX 0XXX  X XXXXX XXXX   0   X       X  X  0 X0 0 0XXX  X  X 000X 0   X XXXX  X    X  00 X       XXXXXX   XXX            XXXXX         ',
/*40*/'     XXXXXXXXXXXX       X          XX      X  X X00 0  X      X0 X0X  XX FX     XX XX X 0 X XX     X   0 X0  X X      X   X 0   X X      XX 0 0   XX X      X  X  XX  0 X      X    XX 00X X   XXXXXX00   X   X   X####X  XXXXXXXX   X#X### XX          X####   X          X####   X          XXXXXXXXX         ',
/*41*/'           XXXXX             XX   XX           XX     X          XX  00  X         XX 00  0 X         X 0    0 X  XXXX   X   00 XXXXXX  XXXXXXXX XX    XX#            000FXX#X XXXXXXX XX   XXX#X XXXXXXX# X0 0XXX########### X    XXXXXXXXXXXXXXX  0 X             XX  XX              XXXX                    ',
/*42*/'                         XXXXXXXX        XXXX      XXXXXX   X    XX 0 0   FX   X XX XX0X0 0 0XX XXX ######X  00 XX X   ######X  X   X X X ######X0  0  X X X ###### 00X 0 X X  0XXX XXX0  0 XX XXX  0  0  0  0 X    X   0 0  0  0 X    XXXXXX   XXXXXX         XXXXX                                            ',
/*43*/'                                                                 XXXXXXX        XXXXX  X  XXXX     X   X   0    X  XXXX X00 XX XX  X XX      X X  XX XXXX  XXX 0X0  0  0  XX###    X XX  X   XX###X    F X XXX XXX###X  XXX  0  0  XXXXXXXXX XX   X   X          XXXXXXXXX                                      ',
/*44*/'                    XXXXX              X   X              X X XXXXXXX        X      0FXXXXXX    X 0 XX0 XXX   X    X XXXX 0    0 X    X XXXXX X  X0 XXXXXX  XXXX XX0      XX  0X  0  X XX XX XX         X X###X XXXXXXX  XXX  ###  X     XXXX X X###X X          X XXX X X          X       X          XXXXXXXXX',
/*45*/'                     XXXXX XXXX         X###X X  XXXX      X###XXX  0  X      X####XX 0  0XXX    XX####XX   0  X    XXX### XX 0 0 X    X XX    X  0  X    X  XX X XXX XXXX   X 0 X X0  0    X   X  0 F 0    0  X   X   X 0 00 0 XXX   X  XXXXXX  XXX     X XX    XXXX       XXX                                 ',
/*46*/'   XXXXXXXXXX         X        XXXX      X XXXXXX X  XX     X X 0 0 0  0 X     X       X0   X     XXX0  00X  XXX       X  XX X 0XX        XX0X   0 FX         X  0 0 XXX         X X   0  X         X XX   X X        XX  XXXXX X        X         X        X#######XXX        X#######X          XXXXXXXXX     ',
/*47*/'                                                XXXX       XXXXXXXXX  XX     XX  0      0 XXXXX X   XX XX   XX###X X X00 0 00X0XX###X X X    F  X   ###X X  0X XXX00   ###X X 0  00  0 XX####X XXX0       XXXXXXX   X  XXXXXXX         XXXX                                                                     ',
/*48*/'     XXXXXXXXX          X1#1X1#1X          X#1#1#1#X          X1#1#1#1X          X#1#1#1#X          X1#1#1#1X          XXX   XXX            X   X          XXXXXX XXXXXX      X           X      X 0 0 0 0 0 X      XX 0 0 0 0 XX       X0 0 0 0 0X        X   0F0   X        X  XXXXX  X        XXXX   XXXX    ',
/*49*/'                            XXXX               X  XX              X   XX             X 00 XX          XXX0  0 XX      XXXX    0   X    XXX  X XXXXX  X    X    X X####0 X    X X   0 ####X X    X  0 X X#1##X X    XXX  XXXX XXX X      XXXX F0  XX0XX        XXX 0     X          X  XX   X          XXXXXXXXX ',
/*50*/'      XXXXXXXXXXXX      XX##    X   X     XX##1 0    0 X    XX##1#X X X0 XX    X##1#X X X 0  X XXXX###X  X    X X X  XX X          X X F0 0 XXX  X X XX X 0   0   X X   X  XXX00   X X X X X    X   0   X X XXXXX  X 0X XXXXX      X  X0   X   X   X  X  X  XXX   XX     X  X  X      X    XX  XXXX      XXXXXX '
];


var sb = null;

function load_map(n)
{
    sb = new Sokoban();
    sb.grid_width  = 19;
    sb.grid_height = 16;

    if (n == -1) {
        sb.grid_width  = 26;
        sb.grid_height = 16;
        sb.grid_code   = '' +
'                          ' +
'XXXXXXX                   ' +
'   X                  X   ' +
'   X                  X   ' +
'   X   XXXX   XXXX  XXXXX ' +
'   X  X    X X    X   X   ' +
'   X  XXXXXX  XX      X   ' +
'   X  X         XX    X   ' +
'   X  X    X X    X   X  X' +
'   X   XXXX   XXXX     XX ' +
'                          ' +
':::::::::XXXXXXXX:::::::::' +
'::::::::X       X:::::::::' +
'::::::::X F 0 # X:::::::::' +
'::::::::X       X:::::::::' +
':::::::::XXXXXXX::::::::::';

    }
    else {
        sb.grid_code  = sb_maps[n];
    }

    sb.render_grid();
    $('map').innerHTML = lpad(n + 1, 2);
}


function sokoban_move(e)
{
    var keynum;

    if (sb == null) {
        return true;
    }

    if (window.event) {
        keynum = e.keyCode;
    }
    else if (e.which) {
        keynum = e.which;
    }

    if (keynum == 85) {
        sb.undo_move();
        return false;
    }

    if (keynum == 37 || keynum == 100 || keynum == 65) { sb.validate_move(SD_LEFT); return false; }
    if (keynum == 39 || keynum == 102 || keynum == 68) { sb.validate_move(SD_RIGHT); return false; }
    if (keynum == 38 || keynum == 104 || keynum == 87) { sb.validate_move(SD_FORWARD); return false; }
    if (keynum == 40 || keynum ==  98 || keynum == 83) { sb.validate_move(SD_BACKWARD); return false; }

    return true;
}


function skb()
{
    load_map(location.href.match(/test$/) ? -1 : 0);

    for (var tmp = '', i = 0; i < sb_maps.length; i++) {
        tmp += '<td><span onclick="load_map( ' + i + ')" style="cursor: pointer; color: #0099CC;">' + lpad(i + 1, 2) + '</span></td>';

        if (i % 10 == 9) {
            tmp += '</tr>' + (i + 1 == sb_maps.length ? '' : '<tr>');
        }
    }

    $('maps').innerHTML = '<table cellspacing="1" cellpadding="0" border="0" id="elevator"><tr>'
        + tmp + (i + sb_maps.length ? '' : '</tr>') + '</table>';
}

