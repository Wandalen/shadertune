module.exports = `
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 45px;
    height: 24px;
  }
  .toggle-switch input {
    display: none;
  }
  .toggle-switch .slider {
    position: absolute;
    top: 0px;
    left: 0px;
    right: 0px;
    bottom: 0px;
    background-color: #999;
    transition: 0.2s;
    border-radius: 12px;
  }
  .slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 3px;
    top: 2px;
    bottom: 2px;
    background-color: #666;
    transition: 0.2s;
    border-radius: 10px;
  }
  input:checked + .slider {
    background-color: #f08;
  }
  input:checked + .slider:before {
    transform: translateX(19px);
    background-color: #704;
  }
`
