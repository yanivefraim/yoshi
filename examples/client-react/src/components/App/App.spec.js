import 'jsdom-global/register';
import React from 'react';
import {expect} from 'chai';
import {mount} from 'enzyme';
import {App} from './App';

describe('App', () => {
  it('renders a title correctly', () => {
    const wrapper = mount(<App/>);
    expect(wrapper.find('h2').length).to.eq(1);
  });
});
