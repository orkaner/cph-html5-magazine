require 'test_helper'

class MagtemplatesControllerTest < ActionController::TestCase
  setup do
    @magtemplate = magtemplates(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:magtemplates)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create magtemplate" do
    assert_difference('Magtemplate.count') do
      post :create, magtemplate: { name: @magtemplate.name, path: @magtemplate.path }
    end

    assert_redirected_to magtemplate_path(assigns(:magtemplate))
  end

  test "should show magtemplate" do
    get :show, id: @magtemplate
    assert_response :success
  end

  test "should get edit" do
    get :edit, id: @magtemplate
    assert_response :success
  end

  test "should update magtemplate" do
    put :update, id: @magtemplate, magtemplate: { name: @magtemplate.name, path: @magtemplate.path }
    assert_redirected_to magtemplate_path(assigns(:magtemplate))
  end

  test "should destroy magtemplate" do
    assert_difference('Magtemplate.count', -1) do
      delete :destroy, id: @magtemplate
    end

    assert_redirected_to magtemplates_path
  end
end
