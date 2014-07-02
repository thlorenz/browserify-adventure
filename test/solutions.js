var fs = require('fs');
var path = require('path');
var test = require('tape');
var spawn = require('child_process').spawn;
var browserify = require('browserify');

var names = require('../menu.json').filter(function (name) {
    return !/^!/.test(name)
});

var dirs = names.map(function (name) {
    return path.join(
        __dirname, '../solutions',
        name.toLowerCase().replace(/\W+/g, '_')
    );
});

var customBuild = {
    'BUILD A WIDGET': function (dir) {
        var b = browserify();
        b.require(path.join(dir, 'widget.js'), { expose: 'widget' });
        return b.bundle();
    }
};

test(function (t) {
    t.plan(names.length * 2);
    
    (function next () {
        if (names.length === 0) return;
        
        var name = names.shift();
        var dir = dirs.shift();
        var main = path.join(dir, 'main.js');
        
        cmd(['select',name]).on('exit', function (code) {
            t.equal(code, 0, 'select ' + name);
            
            var ps = cmd('verify');
            ps.stderr.pipe(process.stderr); 
            ps.stdout.pipe(process.stderr); 
            ps.on('exit', function (code) {
                t.equal(code, 0, 'verify ' + name);
                next();
            });
            
            var b;
            if (customBuild[name]) {
                b = customBuild[name](dir);
            }
            else b = browserify(main).bundle();
            b.pipe(ps.stdin);
        });
    })();
});

function cmd (args) {
    return spawn(process.execPath, [
        path.join(__dirname, '../bin/cmd.js')
    ].concat(args));
}
