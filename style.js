module.exports = `
  body {
    font-family: monospace;
    margin: 0px;
    background-color: #101;
  }
  ${require('./ui/toggle-switch/css')}
  #topbar {
    height: 39px;
    padding-top: 3px;
    padding-left: 4px;
    background-color: #101;
    border-bottom: 1px solid #f08;
  }
  #topbar button.play {
    background-color: transparent;
    border-radius: 10px;
    border: 3px solid #f08;
    padding-top: 4px;
    padding-bottom: 2px;
    padding-left: 15px;
    padding-right: 15px;
    margin-top: 2px;
    margin-left: 4px;
  }
  #topbar .title {
    display: inline-block;
    color: #f08;
    vertical-align: top;
    margin: 0px;
    margin-top: 0.4em;
    margin-left: 10px;
    font-size: 1.4em;
  }
  #topbar .settings {
    float: right;
    padding: 0px;
    margin-right: 4px;
    background-color: transparent;
    border: 2px solid transparent;
    border-radius: 8px;
  }
  #topbar .settings svg {
    transition: 0.3s;
  }
  #topbar .settings input {
    display: none;
  }
  #topbar .settings input:checked + svg {
    transform: rotate(45deg);
  }
  #topbar .settings svg path {
    stroke-width: 2px;
    fill: #f08;
    stroke: transparent;
  }
  #topbar .settings input:checked + svg path {
    fill: #101;
    stroke: #f08;
  }
  #topbar .toggle-switch.live {
    float: right;
    margin-right: 8px;
    margin-top: 5px;
  }
  #codebox {
    position: absolute;
    overflow: hidden;
    top: 43px;
    bottom: 0px;
    left: 0px;
    right: 0px;
    padding: 0px;
    padding-right: 8px;
    padding-bottom: 9px;
  }
  #code {
    padding: 4px;
    padding-left: 8px;
    padding-right: 8px;
    margin: 0px;
    width: 100%;
    height: 100%;
    color: #fff;
    background-color: #101;
    border-width: 0px;
    font-family: monospace;
  }
`
