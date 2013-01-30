#nodeportal
==========

nodeportal (or simply NP) is a portal platform built on Node.js and mongodb making it amazingly fast.

##Install, create and run a new site.
Execute following commands to install nodeportal globally and create a new site:

    npm install nodeportal -g
    nodeportal -n ~/NP

or simply clone the repo:

    git clone git://github.com/saggiyogesh/nodeportal.git
    
and install dependencies:
    
     npm install
     
Run the server:

    node index

##External dependencies.
* node.js, version 0.6 or 0.8
* mongodb, version > 2.0
* imagemagick

##Default data.
* Admin email and password: `admin@nodeportal.com`/`admin`
* Default theme based on twitter bootstrap
* Layouts:
    1. One column layout
    2. 70 - 30 layout

##Configuration:
`np.properties` in `/lib` folder contains all needed configuration information like DB connection information etc of portal.

##New in version 0.1
* Themebuilder and Layoutbuilder plugin - to create new themes and layouts. Newly created themes and layouts can be edited and changes are reflected on runtime without any server restart.


##More Information.

* <a href="http://groups.google.com/group/nodeportal">Google group</a> for discussion.
* [Home Page](http://www.nodeportal.com/ "nodeportal")

##License.
The MIT License (MIT)

Copyright (c) 2012 Yogesh

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
